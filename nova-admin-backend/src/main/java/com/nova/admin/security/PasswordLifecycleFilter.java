package com.nova.admin.security;

import com.fasterxml.jackson.databind.json.JsonMapper;
import com.nova.admin.common.api.R;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.modules.system.service.PasswordLifecyclePolicy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Set;

/** 限制待改密账号仅访问完成改密所需的接口。 */
@Component
@RequiredArgsConstructor
public class PasswordLifecycleFilter extends OncePerRequestFilter {

    private static final Set<String> ALLOWED_PATHS = Set.of(
            "/auth/logout",
            "/auth/refresh",
            "/auth/session-events",
            "/system/user/me",
            "/system/user/me/password"
    );

    private final PasswordLifecyclePolicy passwordLifecyclePolicy;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        LoginUser user = SecurityUtils.getLoginUser().orElse(null);
        String path = request.getRequestURI().substring(request.getContextPath().length());
        if (user != null && passwordLifecyclePolicy.isPasswordChangeRequired(user) && !ALLOWED_PATHS.contains(path)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(JsonMapper.builder().build().writeValueAsString(
                    R.fail(ResultCode.PASSWORD_CHANGE_REQUIRED)));
            return;
        }
        filterChain.doFilter(request, response);
    }
}
