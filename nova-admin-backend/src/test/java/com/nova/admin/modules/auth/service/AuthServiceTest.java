package com.nova.admin.modules.auth.service;

import com.nova.admin.modules.auth.dto.LoginRequest;
import com.nova.admin.modules.auth.security.UserDetailsServiceImpl;
import com.nova.admin.modules.system.dto.SecuritySettingsDTO;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.service.SysConfigService;
import com.nova.admin.modules.system.service.PasswordLifecyclePolicy;
import com.nova.admin.modules.system.service.SysLoginLogService;
import com.nova.admin.security.JwtUtil;
import com.nova.admin.security.LoginSession;
import com.nova.admin.security.LoginUser;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private CaptchaService captchaService;

    @Mock
    private LoginAttemptService loginAttemptService;

    @Mock
    private SysUserMapper userMapper;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    @Mock
    private AuthSessionService authSessionService;

    @Mock
    private SysLoginLogService loginLogService;

    @Mock
    private SysConfigService sysConfigService;

    @Mock
    private PasswordLifecyclePolicy passwordLifecyclePolicy;

    @InjectMocks
    private AuthService authService;

    @Test
    void login_usesConfiguredTokenDurationsForTokensAndSession() {
        SecuritySettingsDTO settings = new SecuritySettingsDTO();
        settings.setAccessTokenExpireMinutes(5);
        settings.setRefreshTokenExpireMinutes(60);
        SysUser user = new SysUser();
        user.setId(1L);
        user.setAccount("admin");
        user.setPassword("encoded-password");
        user.setNickname("Admin");
        LoginUser loginUser = LoginUser.builder()
                .userId(1L)
                .account("admin")
                .nickname("Admin")
                .roles(Set.of("super_admin"))
                .permissions(Set.of())
                .build();
        Claims accessClaims = org.mockito.Mockito.mock(Claims.class);
        Claims refreshClaims = org.mockito.Mockito.mock(Claims.class);
        given(loginAttemptService.isLocked("admin")).willReturn(false);
        given(userMapper.selectByAccount("admin")).willReturn(user);
        given(passwordEncoder.matches("password", "encoded-password")).willReturn(true);
        given(userDetailsService.refreshCache(eq(user), any())).willReturn(loginUser);
        given(sysConfigService.getSecuritySettings()).willReturn(settings);
        given(passwordLifecyclePolicy.isPasswordChangeRequired(loginUser)).willReturn(false);
        given(jwtUtil.generateAccessToken(1L, "admin", 5L)).willReturn("access-token");
        given(jwtUtil.generateRefreshToken(1L, "admin", 60L)).willReturn("refresh-token");
        given(jwtUtil.getExpireSeconds(5L)).willReturn(300L);
        given(jwtUtil.getExpireSeconds(60L)).willReturn(3600L);
        given(jwtUtil.parse("access-token")).willReturn(accessClaims);
        given(jwtUtil.parse("refresh-token")).willReturn(refreshClaims);
        given(accessClaims.get("jti", String.class)).willReturn("access-jti");
        given(refreshClaims.get("jti", String.class)).willReturn("refresh-jti");

        LoginRequest request = new LoginRequest();
        request.setAccount("admin");
        request.setPassword("password");
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        httpRequest.addHeader("User-Agent", "Nova Test");

        var response = authService.login(request, httpRequest);

        assertThat(response.getExpiresIn()).isEqualTo(300L);
        assertThat(response.getPasswordChangeRequired()).isFalse();
        verify(jwtUtil).generateAccessToken(1L, "admin", 5L);
        verify(jwtUtil).generateRefreshToken(1L, "admin", 60L);
        ArgumentCaptor<LoginSession> sessionCaptor = ArgumentCaptor.forClass(LoginSession.class);
        verify(authSessionService).register(sessionCaptor.capture(), eq(300L), eq(3600L));
        assertThat(sessionCaptor.getValue())
                .extracting(LoginSession::getAccessJti, LoginSession::getRefreshJti, LoginSession::getUserAgent)
                .containsExactly("access-jti", "refresh-jti", "Nova Test");
    }
}
