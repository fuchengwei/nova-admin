package com.nova.admin.config;

import com.nova.admin.common.api.R;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.security.JwtAuthFilter;
import com.nova.admin.security.PasswordLifecycleFilter;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Spring Security 配置
 */
@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final NovaProperties novaProperties;
    private final JwtAuthFilter jwtAuthFilter;
    private final PasswordLifecycleFilter passwordLifecycleFilter;

    /** 白名单（无需认证） */
    public static final String[] WHITELIST = {
            "/public/**",
            "/auth/login",
            "/auth/captcha",
            "/auth/refresh",
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/doc.html",
            "/actuator/health",
            "/favicon.ico",
            "/error",
            "/file/preview/**",
            "/system/config/basic"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(c -> c.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // SseEmitter.complete() triggers an async redispatch after the original
                        // request was already authenticated; do not re-check the revoked token.
                        .dispatcherTypeMatchers(DispatcherType.ASYNC).permitAll()
                        .requestMatchers(WHITELIST).permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(e -> e
                        .authenticationEntryPoint((ignored, resp, ex) -> writeJson(resp,
                                HttpServletResponse.SC_UNAUTHORIZED,
                                R.fail(ResultCode.UNAUTHORIZED,
                                        messageOrDefault(ex.getMessage(), ResultCode.UNAUTHORIZED))))
                        .accessDeniedHandler((ignored, resp, ex) -> writeJson(resp,
                                HttpServletResponse.SC_FORBIDDEN,
                                R.fail(ResultCode.FORBIDDEN,
                                        messageOrDefault(ex.getMessage(), ResultCode.FORBIDDEN)))))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(passwordLifecycleFilter, JwtAuthFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOriginPatterns(novaProperties.getCors().getAllowedOrigins());
        cfg.setAllowedMethods(Arrays.asList(novaProperties.getCors().getAllowedMethods().split(",")));
        cfg.setAllowedHeaders(Arrays.asList(novaProperties.getCors().getAllowedHeaders().split(",")));
        cfg.setAllowCredentials(novaProperties.getCors().isAllowCredentials());
        cfg.setMaxAge(novaProperties.getCors().getMaxAge());
        UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
        src.registerCorsConfiguration("/**", cfg);
        return src;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) {
        return cfg.getAuthenticationManager();
    }

    private void writeJson(HttpServletResponse resp, int status, R<?> body) throws java.io.IOException {
        if (resp.isCommitted()) {
            return;
        }
        resp.setStatus(status);
        resp.setContentType(MediaType.APPLICATION_JSON_VALUE);
        resp.setCharacterEncoding(StandardCharsets.UTF_8.name());
        resp.getWriter().write(com.fasterxml.jackson.databind.json.JsonMapper.builder().build()
                .writeValueAsString(body));
    }

    private String messageOrDefault(String message, ResultCode fallback) {
        return message == null || message.isBlank() ? fallback.getMsg() : message;
    }
}
