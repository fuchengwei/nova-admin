package com.nova.admin.modules.auth.security;

import com.nova.admin.common.constant.Constants;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.security.LoginUser;
import com.nova.admin.security.SecurityUser;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysMenuMapper;
import com.nova.admin.modules.system.mapper.SysApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Spring Security UserDetailsService 实现
 */
@Service
@RequiredArgsConstructor
@SuppressWarnings("NullableProblems")
public class UserDetailsServiceImpl implements UserDetailsService {

    private final SysUserMapper userMapper;
    private final SysRoleMapper roleMapper;
    private final SysMenuMapper menuMapper;
    private final SysApiPermissionMapper apiPermissionMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public UserDetails loadUserByUsername(String account) throws UsernameNotFoundException {
        // 先查缓存
        String cacheKey = Constants.REDIS_KEY_USER + account;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof LoginUser lu) {
            if (lu.getLoginIp() == null || lu.getLoginTime() == null) {
                SysUser user = getActiveUser(account);
                lu.setLoginIp(user.getLastLoginIp());
                lu.setLoginTime(toEpochMillis(user.getLastLoginTime()));
                redisTemplate.opsForValue().set(cacheKey, lu, Duration.ofMinutes(30));
            }
            return new SecurityUser(lu, "");
        }
        // 查数据库
        SysUser user = getActiveUser(account);

        LoginUser loginUser = buildLoginUser(user, user.getLastLoginIp(), toEpochMillis(user.getLastLoginTime()));
        // 缓存 30 分钟
        redisTemplate.opsForValue().set(cacheKey, loginUser, Duration.ofMinutes(30));
        return new SecurityUser(loginUser, "");
    }

    private SysUser getActiveUser(String account) {
        SysUser user = userMapper.selectByAccount(account);
        if (user == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BizException(ResultCode.USER_DISABLED);
        }
        return user;
    }

    private Long toEpochMillis(java.time.LocalDateTime loginTime) {
        return loginTime == null ? null : loginTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    /** 登录后重新建立缓存（包含 loginIp/loginTime） */
    public LoginUser refreshCache(SysUser user, String loginIp) {
        LoginUser loginUser = buildLoginUser(user, loginIp, System.currentTimeMillis());
        String cacheKey = Constants.REDIS_KEY_USER + user.getAccount();
        redisTemplate.opsForValue().set(cacheKey, loginUser, Duration.ofMinutes(30));
        return loginUser;
    }

    /**
     * 构建 LoginUser 对象（加载角色、权限、数据范围）
     */
    private LoginUser buildLoginUser(SysUser user, String loginIp, Long loginTime) {
        // 加载角色
        List<String> roleCodes = roleMapper.selectRoleCodesByUserId(user.getId());
        Set<String> roles = new HashSet<>(roleCodes);
        // 加载权限
        List<String> menuPerms = menuMapper.selectPermsByUserId(user.getId());
        List<String> apiPerms = apiPermissionMapper.selectPermsByUserId(user.getId());
        Set<String> permissions = java.util.stream.Stream.concat(
                        menuPerms == null ? java.util.stream.Stream.empty() : menuPerms.stream(),
                        apiPerms == null ? java.util.stream.Stream.empty() : apiPerms.stream())
                .filter(p -> p != null && !p.isBlank())
                .collect(Collectors.toSet());

        // 超管直接拥有全部数据权限，无需查角色
        Integer dataScope = Integer.valueOf(1).equals(user.getSuperAdmin())
                ? 1
                : resolveDataScope(user.getId());
        Set<Long> customDeptIds = Integer.valueOf(1).equals(user.getSuperAdmin())
                ? Set.of()
                : resolveCustomDeptIds(user.getId());

        return LoginUser.builder()
                .userId(user.getId())
                .account(user.getAccount())
                .nickname(user.getNickname())
                .deptId(user.getDeptId())
                .roles(roles)
                .permissions(permissions)
                .dataScope(dataScope)
                .customDeptIds(customDeptIds)
                .forcePasswordChange(user.getForcePasswordChange())
                .passwordChangedAt(user.getPasswordChangedAt())
                .loginIp(loginIp)
                .loginTime(loginTime)
                .build();
    }

    /**
     * 计算用户的固定数据范围：忽略自定义部门范围后取所有角色 dataScope 中的最小值（数值越小权限越宽）。
     * 超管角色 data_scope=1（全部），会自然得到最宽范围；无角色则默认仅本人(5)。
     */
    private Integer resolveDataScope(Long userId) {
        List<Integer> scopes = roleMapper.selectDataScopesByUserId(userId);
        if (scopes == null || scopes.isEmpty()) {
            return 5;
        }
        return scopes.stream()
                .filter(scope -> !Integer.valueOf(6).equals(scope))
                .min(Integer::compareTo)
                .orElse(scopes.stream().anyMatch(scope -> Integer.valueOf(6).equals(scope)) ? 6 : 5);
    }

    private Set<Long> resolveCustomDeptIds(Long userId) {
        List<Long> deptIds = roleMapper.selectCustomDeptIdsByUserId(userId);
        return deptIds == null ? Set.of() : new HashSet<>(deptIds);
    }
}
