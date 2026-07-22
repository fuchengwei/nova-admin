package com.nova.admin.modules.auth.security;

import com.nova.admin.common.constant.Constants;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.security.LoginUser;
import com.nova.admin.security.SecurityUser;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysMenuMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Spring Security UserDetailsService 实现
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final SysUserMapper userMapper;
    private final SysRoleMapper roleMapper;
    private final SysMenuMapper menuMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 先查缓存
        String cacheKey = Constants.REDIS_KEY_USER + username;
        Object cached = redisTemplate.opsForValue().get(cacheKey);
        if (cached instanceof LoginUser lu) {
            return new SecurityUser(lu, "");
        }
        // 查数据库
        SysUser user = userMapper.selectByUsername(username);
        if (user == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BizException(ResultCode.USER_DISABLED);
        }
        // 加载角色
        List<String> roleCodes = roleMapper.selectRoleCodesByUserId(user.getId());
        Set<String> roles = new HashSet<>(roleCodes);
        // 加载权限
        List<String> perms = menuMapper.selectPermsByUserId(user.getId());
        Set<String> permissions = perms.stream().filter(p -> p != null && !p.isBlank()).collect(Collectors.toSet());

        LoginUser loginUser = LoginUser.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .deptId(user.getDeptId())
                .roles(roles)
                .permissions(permissions)
                .build();

        // 缓存 30 分钟
        redisTemplate.opsForValue().set(cacheKey, loginUser, 30, TimeUnit.MINUTES);
        return new SecurityUser(loginUser, "");
    }

    /** 登录后重新建立缓存（包含 loginIp/loginTime） */
    public LoginUser refreshCache(SysUser user, String loginIp) {
        List<String> roleCodes = roleMapper.selectRoleCodesByUserId(user.getId());
        Set<String> roles = new HashSet<>(roleCodes);
        List<String> perms = menuMapper.selectPermsByUserId(user.getId());
        Set<String> permissions = perms.stream().filter(p -> p != null && !p.isBlank()).collect(Collectors.toSet());

        LoginUser loginUser = LoginUser.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .nickname(user.getNickname())
                .deptId(user.getDeptId())
                .roles(roles)
                .permissions(permissions)
                .loginIp(loginIp)
                .loginTime(System.currentTimeMillis())
                .build();
        String cacheKey = Constants.REDIS_KEY_USER + user.getUsername();
        redisTemplate.opsForValue().set(cacheKey, loginUser, 30, TimeUnit.MINUTES);
        return loginUser;
    }

    /** 失效用户缓存（信息变更时调用） */
    public void evict(String username) {
        redisTemplate.delete(Constants.REDIS_KEY_USER + username);
    }
}
