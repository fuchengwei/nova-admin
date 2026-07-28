package com.nova.admin.security;

import com.nova.admin.config.NovaProperties;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.auth.service.AuthSessionService;
import com.nova.admin.modules.auth.security.UserDetailsServiceImpl;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT 认证过滤器：解析 Authorization -> 加载 LoginUser -> 写入 SecurityContext
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final NovaProperties novaProperties;
    private final AuthSessionService authSessionService;
    private final UserDetailsServiceImpl userDetailsService;

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
                String jti = claims.get("jti", String.class);
                String account = claims.get("account", String.class);

                // JWT 仅用于防篡改和过期校验，服务端会话存在才代表令牌仍可使用。
                if (!authSessionService.isActive(jti)) {
                    throw new BizException(ResultCode.TOKEN_EXPIRED);
                }

                // 从 UserDetailsService 加载（已含角色/权限缓存）
                UserDetails ud = userDetailsService.loadUserByUsername(account);
                if (ud instanceof SecurityUser securityUser) {
                    securityUser.getLoginUser().setJti(jti);
                }
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(ud, null, ud.getAuthorities());
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (BizException ex) {
            SecurityContextHolder.clearContext();
            log.debug("JWT 解析失败: {}", ex.getMessage());
        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
            log.warn("JWT 处理异常", ex);
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
