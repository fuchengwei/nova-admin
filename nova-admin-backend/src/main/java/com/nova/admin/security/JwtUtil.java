package com.nova.admin.security;

import com.nova.admin.config.NovaProperties;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.common.api.ResultCode;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

/**
 * JWT 工具类
 */
@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final NovaProperties novaProperties;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(
                novaProperties.getSecurity().getJwt().getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(Long userId, String username) {
        NovaProperties.Jwt jwt = novaProperties.getSecurity().getJwt();
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("username", username)
                .claim("type", "access")
                .issuedAt(new Date(now))
                .expiration(new Date(now + jwt.getAccessTokenExpireMinutes() * 60_000L))
                .signWith(getKey())
                .compact();
    }

    public String generateRefreshToken(Long userId, String username) {
        NovaProperties.Jwt jwt = novaProperties.getSecurity().getJwt();
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("username", username)
                .claim("type", "refresh")
                .issuedAt(new Date(now))
                .expiration(new Date(now + jwt.getRefreshTokenExpireMinutes() * 60_000L))
                .signWith(getKey())
                .compact();
    }

    public Claims parse(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (JwtException ex) {
            throw new BizException(ResultCode.TOKEN_INVALID);
        }
    }

    public long getAccessExpireSeconds() {
        return novaProperties.getSecurity().getJwt().getAccessTokenExpireMinutes() * 60L;
    }

    public long getRefreshExpireSeconds() {
        return novaProperties.getSecurity().getJwt().getRefreshTokenExpireMinutes() * 60L;
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
