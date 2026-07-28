package com.nova.admin.security;

import com.nova.admin.config.NovaProperties;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.common.api.ResultCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;
import java.util.UUID;

/**
 * JWT 工具类
 */
@Component
public class JwtUtil {

    private final NovaProperties novaProperties;
    /** 与 NovaProperties 绑定的同一把密钥，签名与验签必须复用同一个实例，避免二者推导出不同的密钥材料 */
    private final SecretKey key;

    public JwtUtil(NovaProperties novaProperties) {
        this.novaProperties = novaProperties;
        String secret = novaProperties.getSecurity().getJwt().getSecret();
        if (!StringUtils.hasText(secret)) {
            throw new IllegalStateException("nova.security.jwt.secret 未配置，JWT 无法初始化");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Long userId, String account) {
        return generateAccessToken(userId, account, novaProperties.getSecurity().getJwt().getAccessTokenExpireMinutes());
    }

    public String generateAccessToken(Long userId, String account, long expireMinutes) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(userId))
                .claim("account", account)
                .claim("type", "access")
                .issuedAt(new Date(now))
                .expiration(new Date(now + expireMinutes * 60_000L))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(Long userId, String account) {
        return generateRefreshToken(userId, account, novaProperties.getSecurity().getJwt().getRefreshTokenExpireMinutes());
    }

    public String generateRefreshToken(Long userId, String account, long expireMinutes) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(String.valueOf(userId))
                .claim("account", account)
                .claim("type", "refresh")
                .issuedAt(new Date(now))
                .expiration(new Date(now + expireMinutes * 60_000L))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException ex) {
            throw new BizException(ResultCode.TOKEN_INVALID);
        }
    }

    public long getAccessExpireSeconds() {
        return getExpireSeconds(novaProperties.getSecurity().getJwt().getAccessTokenExpireMinutes());
    }

    public long getRefreshExpireSeconds() {
        return getExpireSeconds(novaProperties.getSecurity().getJwt().getRefreshTokenExpireMinutes());
    }

    public long getExpireSeconds(long expireMinutes) {
        return expireMinutes * 60L;
    }

    public Map<String, Object> getTokenConfig() {
        NovaProperties.Jwt jwt = novaProperties.getSecurity().getJwt();
        return Map.of(
                "accessTokenExpireSeconds", getAccessExpireSeconds(),
                "refreshTokenExpireSeconds", getRefreshExpireSeconds(),
                "header", jwt.getHeader(),
                "prefix", jwt.getPrefix()
        );
    }
}
