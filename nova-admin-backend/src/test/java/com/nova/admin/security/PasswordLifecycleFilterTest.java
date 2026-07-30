package com.nova.admin.security;

import com.nova.admin.modules.system.service.PasswordLifecyclePolicy;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class PasswordLifecycleFilterTest {

    @Mock
    private PasswordLifecyclePolicy passwordLifecyclePolicy;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void doFilterInternal_whenPasswordChangeIsRequired_blocksBusinessPath() throws Exception {
        LoginUser user = authenticatedUser();
        given(passwordLifecyclePolicy.isPasswordChangeRequired(user)).willReturn(true);
        PasswordLifecycleFilter filter = new PasswordLifecycleFilter(passwordLifecyclePolicy);
        MockHttpServletRequest request = request("GET", "/api/dashboard");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean(false);

        filter.doFilter(request, response, (req, res) -> continued.set(true));

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("\"code\":1008");
        assertThat(continued).isFalse();
    }

    @Test
    void doFilterInternal_whenPasswordChangeIsRequired_allowsPasswordUpdate() throws Exception {
        LoginUser user = authenticatedUser();
        given(passwordLifecyclePolicy.isPasswordChangeRequired(user)).willReturn(true);
        PasswordLifecycleFilter filter = new PasswordLifecycleFilter(passwordLifecyclePolicy);
        MockHttpServletRequest request = request("PUT", "/api/system/user/me/password");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean(false);

        filter.doFilter(request, response, (req, res) -> continued.set(true));

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(continued).isTrue();
    }

    @Test
    void doFilterInternal_whenPasswordChangeIsRequired_allowsSessionEvents() throws Exception {
        LoginUser user = authenticatedUser();
        given(passwordLifecyclePolicy.isPasswordChangeRequired(user)).willReturn(true);
        PasswordLifecycleFilter filter = new PasswordLifecycleFilter(passwordLifecyclePolicy);
        MockHttpServletRequest request = request("GET", "/api/auth/session-events");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continued = new AtomicBoolean(false);

        filter.doFilter(request, response, (req, res) -> continued.set(true));

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(continued).isTrue();
    }

    private LoginUser authenticatedUser() {
        LoginUser user = LoginUser.builder().userId(1L).account("user").build();
        SecurityUser principal = new SecurityUser(user, "");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of()));
        return user;
    }

    private MockHttpServletRequest request(String method, String uri) {
        MockHttpServletRequest request = new MockHttpServletRequest(method, uri);
        request.setContextPath("/api");
        request.setRequestURI(uri);
        return request;
    }
}
