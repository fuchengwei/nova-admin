package com.nova.admin.security;

import com.nova.admin.config.NovaProperties;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 认证过滤器：解析 Authorization -> 加载 LoginUser -> 写入 SecurityContext
 * <p>详细登录逻辑（校验密码、加载权限）将在 Phase 1 实现，本阶段只做骨架。
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final NovaProperties novaProperties;
    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        try {
            String token = resolveToken(request);
            if (StringUtils.hasText(token)) {
                Claims claims = jwtUtil.parse(token);
                String type = claims.get("type", String.class);
                if (!"access".equals(type)) {
                    throw new BizException(ResultCode.TOKEN_INVALID);
                }
                Long userId = Long.valueOf(claims.getSubject());
                String blacklistKey = "nova:token:blacklist:" + userId;
                if (Boolean.TRUE.equals(redisTemplate.hasKey(blacklistKey))) {
                    throw new BizException(ResultCode.TOKEN_EXPIRED);
                }
                // TODO Phase 1: 从 Redis 加载完整 LoginUser（含 roles/permissions）
                LoginUser loginUser = LoginUser.builder()
                        .userId(userId)
                        .username(claims.get("username", String.class))
                        .build();
                SecurityUser principal = new SecurityUser(loginUser, "");
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (BizException ex) {
            SecurityContextHolder.clearContext();
            log.debug("JWT 解析失败: {}", ex.getMessage());
        }
        chain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        NovaProperties.Jwt jwt = novaProperties.getSecurity().getJwt();
        String header = request.getHeader(jwt.getHeader());
        if (StringUtils.hasText(header) && header.startsWith(jwt.getPrefix())) {
            return header.substring(jwt.getPrefix().length());
        }
        return null;
    }
}
