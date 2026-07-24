package com.nova.admin.modules.auth.service;

import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.constant.Constants;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.security.JwtUtil;
import com.nova.admin.security.LoginUser;
import com.nova.admin.modules.auth.dto.LoginRequest;
import com.nova.admin.modules.auth.dto.LoginResponse;
import com.nova.admin.modules.auth.security.UserDetailsServiceImpl;
import com.nova.admin.modules.system.dto.UserInfoDTO;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 认证服务
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final CaptchaService captchaService;
    private final LoginAttemptService loginAttemptService;
    private final SysUserMapper userMapper;
    private final UserDetailsServiceImpl userDetailsService;
    private final RedisTemplate<String, Object> redisTemplate;

    /** 登录 */
    public LoginResponse login(LoginRequest req, HttpServletRequest httpReq) {
        // 0. 校验图形验证码
        captchaService.verify(req.getCaptchaKey(), req.getCaptchaCode());

        String account = req.getAccount();
        // 1. 账号是否已锁定
        if (loginAttemptService.isLocked(account)) {
            throw new BizException(ResultCode.USER_LOCKED);
        }
        // 2. 查用户
        SysUser user = userMapper.selectByAccount(account);
        if (user == null) {
            loginAttemptService.recordFailure(account);
            throw new BizException(ResultCode.USERNAME_OR_PASSWORD_INVALID);
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BizException(ResultCode.USER_DISABLED);
        }
        // 3. 校验密码
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            long count = loginAttemptService.recordFailure(account);
            log.warn("登录失败: account={} attempts={}", account, count);
            throw new BizException(ResultCode.USERNAME_OR_PASSWORD_INVALID);
        }
        loginAttemptService.reset(account);

        // 4. 生成 token
        String access = jwtUtil.generateAccessToken(user.getId(), user.getAccount());
        String refresh = jwtUtil.generateRefreshToken(user.getId(), user.getAccount());

        // 5. 刷新登录用户缓存（含 loginIp/time）
        String ip = resolveIp(httpReq);
        LoginUser loginUser = userDetailsService.refreshCache(user, ip);

        // 6. 写入 refresh_token 索引（用于注销/踢人）
        redisTemplate.opsForValue().set(
                Constants.REDIS_KEY_AUTH + "refresh:" + user.getId(),
                refresh,
                Duration.ofSeconds(jwtUtil.getRefreshExpireSeconds()));

        // 7. 更新最后登录信息
        user.setLastLoginIp(ip);
        user.setLastLoginTime(LocalDateTime.now());
        userMapper.updateById(user);

        // 8. 构造响应
        UserInfoDTO userInfo = UserInfoDTO.builder()
                .id(user.getId())
                .account(user.getAccount())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .email(user.getEmail())
                .phone(user.getPhone())
                .deptId(user.getDeptId())
                .deptName(user.getDeptName())
                .roles(new ArrayList<>(loginUser.getRoles() == null ? List.of() : loginUser.getRoles()))
                .permissions(new ArrayList<>(loginUser.getPermissions() == null ? List.of() : loginUser.getPermissions()))
                .build();

        return LoginResponse.builder()
                .tokenType("Bearer")
                .accessToken(access)
                .refreshToken(refresh)
                .expiresIn(jwtUtil.getAccessExpireSeconds())
                .userInfo(userInfo)
                .build();
    }

    /** 注销（将当前 access token 的 jti 加入黑名单，并清除 refresh 索引） */
    public void logout(String jti, Long userId) {
        redisTemplate.opsForValue().set(
                Constants.REDIS_KEY_TOKEN_BLACKLIST + jti,
                System.currentTimeMillis(),
                Duration.ofSeconds(jwtUtil.getAccessExpireSeconds()));
        redisTemplate.delete(Constants.REDIS_KEY_AUTH + "refresh:" + userId);
    }

    /** 刷新 token */
    public LoginResponse refresh(String refreshToken) {
        Claims claims;
        try {
            claims = jwtUtil.parse(refreshToken);
        } catch (Exception e) {
            throw new BizException(ResultCode.REFRESH_TOKEN_INVALID);
        }
        if (!"refresh".equals(claims.get("type", String.class))) {
            throw new BizException(ResultCode.REFRESH_TOKEN_INVALID);
        }
        Long userId = Long.valueOf(claims.getSubject());
        String stored = (String) redisTemplate.opsForValue().get(Constants.REDIS_KEY_AUTH + "refresh:" + userId);
        if (stored == null || !stored.equals(refreshToken)) {
            throw new BizException(ResultCode.REFRESH_TOKEN_INVALID);
        }
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }
        String newAccess = jwtUtil.generateAccessToken(userId, user.getAccount());
        String newRefresh = jwtUtil.generateRefreshToken(userId, user.getAccount());
        redisTemplate.opsForValue().set(
                Constants.REDIS_KEY_AUTH + "refresh:" + userId,
                newRefresh,
                Duration.ofSeconds(jwtUtil.getRefreshExpireSeconds()));

        UserInfoDTO userInfo = UserInfoDTO.builder()
                .id(user.getId())
                .account(user.getAccount())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .email(user.getEmail())
                .phone(user.getPhone())
                .deptId(user.getDeptId())
                .build();
        return LoginResponse.builder()
                .tokenType("Bearer")
                .accessToken(newAccess)
                .refreshToken(newRefresh)
                .expiresIn(jwtUtil.getAccessExpireSeconds())
                .userInfo(userInfo)
                .build();
    }

    private String resolveIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
            int idx = ip.indexOf(',');
            return idx > 0 ? ip.substring(0, idx).trim() : ip.trim();
        }
        ip = req.getHeader("X-Real-IP");
        if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }
        return req.getRemoteAddr();
    }
}
