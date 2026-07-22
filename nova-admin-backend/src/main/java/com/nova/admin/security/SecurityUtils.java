package com.nova.admin.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

/**
 * 安全上下文工具（避免与 Spring Security 的 SecurityContextHolder 同名冲突）
 */
public final class SecurityUtils {

    private SecurityUtils() {}

    /** 获取当前登录用户 */
    public static Optional<LoginUser> getLoginUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = auth.getPrincipal();
        if (principal instanceof SecurityUser su) {
            return Optional.of(su.getLoginUser());
        }
        return Optional.empty();
    }

    public static Long requireUserId() {
        return getLoginUser().map(LoginUser::getUserId)
                .orElseThrow(() -> new IllegalStateException("未登录"));
    }
}
