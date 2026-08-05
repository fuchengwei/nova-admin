package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.UserImportResultDTO;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysDeptMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.mapper.SysUserApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysUserRoleMapper;
import com.nova.admin.modules.system.service.impl.SysUserServiceImpl;
import com.nova.admin.security.LoginUser;
import com.nova.admin.security.SecurityUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SysUserImportServiceTest {

    @Mock
    private SysUserMapper userMapper;
    @Mock
    private SysUserRoleMapper userRoleMapper;
    @Mock
    private SysUserApiPermissionMapper userApiPermissionMapper;
    @Mock
    private SysDeptMapper deptMapper;
    @Mock
    private SysRoleMapper roleMapper;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private SysConfigService sysConfigService;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    private SysUserServiceImpl userService;

    @BeforeEach
    void setUp() {
        userService = spy(new SysUserServiceImpl(
                userRoleMapper, userApiPermissionMapper, deptMapper, roleMapper, passwordEncoder,
                sysConfigService, eventPublisher));
        doReturn(userMapper).when(userService).getBaseMapper();
        doReturn(true).when(userService).save(any(SysUser.class));
        given(deptMapper.selectListBySortOrder()).willReturn(List.of());
        given(roleMapper.selectList(any())).willReturn(List.of());
        given(userMapper.selectByAccount(anyString())).willReturn(null);
        given(sysConfigService.getUserImportInitialPassword()).willReturn("Nova@123");
        given(passwordEncoder.encode("Nova@123")).willReturn("encoded-password");
        doNothing().when(sysConfigService).validatePassword("Nova@123");

        SecurityUser principal = new SecurityUser(LoginUser.builder()
                .userId(1L)
                .account("admin")
                .roles(Set.of("super_admin"))
                .build(), "password");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void importUsers_whenEarlierRowIsInvalid_allowsLaterCorrectRowWithSameAccount() {
        byte[] content = UserExcelCodec.export(List.of(
                new UserExcelCodec.UserRow(
                        "zhangsan", "张三", "", "invalid-email", "", "未知", "", "启用", ""),
                new UserExcelCodec.UserRow(
                        "zhangsan", "张三", "", "zhangsan@example.com", "", "未知", "", "启用", "")
        ));

        UserImportResultDTO result = userService.importUsers(
                new MockMultipartFile("file", "users.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", content));

        assertThat(result.getTotal()).isEqualTo(2);
        assertThat(result.getSuccess()).isEqualTo(1);
        assertThat(result.getFailed()).isEqualTo(1);
        assertThat(result.getErrors()).singleElement().satisfies(error ->
                assertThat(error).contains("邮箱格式不正确"));
        ArgumentCaptor<SysUser> userCaptor = ArgumentCaptor.forClass(SysUser.class);
        verify(userService).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getAccount()).isEqualTo("zhangsan");
        assertThat(userCaptor.getValue().getPassword()).isEqualTo("encoded-password");
    }
}
