package com.nova.admin.modules.auth.security;

import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysMenuMapper;
import com.nova.admin.modules.system.mapper.SysApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.security.LoginUser;
import com.nova.admin.security.SecurityUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private SysUserMapper userMapper;

    @Mock
    private SysRoleMapper roleMapper;

    @Mock
    private SysMenuMapper menuMapper;

    @Mock
    private SysApiPermissionMapper apiPermissionMapper;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Test
    void loadUserByUsername_whenCacheMisses_usesLastLoginDetailsForOnlineUser() {
        LocalDateTime lastLoginTime = LocalDateTime.of(2026, 7, 27, 10, 30);
        SysUser user = new SysUser();
        user.setId(1L);
        user.setAccount("admin");
        user.setNickname("Admin");
        user.setSuperAdmin(1);
        user.setLastLoginIp("192.168.1.10");
        user.setLastLoginTime(lastLoginTime);
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.get("nova:user:admin")).willReturn(null);
        given(userMapper.selectByAccount("admin")).willReturn(user);
        given(roleMapper.selectRoleCodesByUserId(1L)).willReturn(List.of("super_admin"));
        given(menuMapper.selectPermsByUserId(1L)).willReturn(List.of("monitor:online:list"));

        SecurityUser result = (SecurityUser) userDetailsService.loadUserByUsername("admin");

        assertThat(result.getLoginUser().getLoginIp()).isEqualTo("192.168.1.10");
        assertThat(result.getLoginUser().getLoginTime()).isEqualTo(
                lastLoginTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
    }

    @Test
    void loadUserByUsername_whenCachedLoginDetailsAreMissing_backfillsThem() {
        LocalDateTime lastLoginTime = LocalDateTime.of(2026, 7, 27, 10, 30);
        SysUser user = new SysUser();
        user.setAccount("admin");
        user.setLastLoginIp("192.168.1.10");
        user.setLastLoginTime(lastLoginTime);
        LoginUser cachedUser = LoginUser.builder().account("admin").build();
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.get("nova:user:admin")).willReturn(cachedUser);
        given(userMapper.selectByAccount("admin")).willReturn(user);

        SecurityUser result = (SecurityUser) userDetailsService.loadUserByUsername("admin");

        assertThat(result.getLoginUser().getLoginIp()).isEqualTo("192.168.1.10");
        assertThat(result.getLoginUser().getLoginTime()).isEqualTo(
                lastLoginTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
    }

    @Test
    void loadUserByUsername_whenRolesContainCustomDepartments_loadsDepartmentUnion() {
        SysUser user = new SysUser();
        user.setId(2L);
        user.setAccount("operator");
        user.setNickname("Operator");
        user.setSuperAdmin(0);
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.get("nova:user:operator")).willReturn(null);
        given(userMapper.selectByAccount("operator")).willReturn(user);
        given(roleMapper.selectRoleCodesByUserId(2L)).willReturn(List.of("operator"));
        given(menuMapper.selectPermsByUserId(2L)).willReturn(List.of("system:user:list"));
        given(roleMapper.selectDataScopesByUserId(2L)).willReturn(List.of(5, 6));
        given(roleMapper.selectCustomDeptIdsByUserId(2L)).willReturn(List.of(10L, 11L));

        SecurityUser result = (SecurityUser) userDetailsService.loadUserByUsername("operator");

        assertThat(result.getLoginUser().getDataScope()).isEqualTo(5);
        assertThat(result.getLoginUser().getCustomDeptIds()).containsExactlyInAnyOrder(10L, 11L);
    }
}
