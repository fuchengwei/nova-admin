package com.nova.admin.modules.auth.service;

import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.security.JwtUtil;
import com.nova.admin.security.LoginSession;
import com.nova.admin.security.LoginUser;
import com.nova.admin.modules.auth.dto.LoginRequest;
import com.nova.admin.modules.auth.dto.LoginResponse;
import com.nova.admin.modules.auth.security.UserDetailsServiceImpl;
import com.nova.admin.modules.system.dto.UserInfoDTO;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.service.SysLoginLogService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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
    private final AuthSessionService authSessionService;
    private final SysLoginLogService loginLogService;

    /** 登录 */
    public LoginResponse login(LoginRequest req, HttpServletRequest httpReq) {
        // 0. 校验图形验证码
        captchaService.verify(req.getCaptchaKey(), req.getCaptchaCode());

        String account = req.getAccount();
        String ip = resolveIp(httpReq);
        String userAgent = httpReq.getHeader("User-Agent");

        // 1. 账号是否已锁定
        if (loginAttemptService.isLocked(account)) {
            loginLogService.recordLoginLog(account, ip, userAgent, false, "账号已锁定");
            throw new BizException(ResultCode.USER_LOCKED);
        }
        // 2. 查用户
        SysUser user = userMapper.selectByAccount(account);
        if (user == null) {
            loginAttemptService.recordFailure(account);
            loginLogService.recordLoginLog(account, ip, userAgent, false, "账号或密码错误");
            throw new BizException(ResultCode.USERNAME_OR_PASSWORD_INVALID);
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            loginLogService.recordLoginLog(account, ip, userAgent, false, "账号已禁用");
            throw new BizException(ResultCode.USER_DISABLED);
        }
        // 3. 校验密码
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            long count = loginAttemptService.recordFailure(account);
            log.warn("登录失败: account={} attempts={}", account, count);
            loginLogService.recordLoginLog(account, ip, userAgent, false, "账号或密码错误");
            throw new BizException(ResultCode.USERNAME_OR_PASSWORD_INVALID);
        }
        loginAttemptService.reset(account);

        // 4. 刷新登录用户缓存（含 loginIp/time）
        LoginUser loginUser = userDetailsService.refreshCache(user, ip);

        // 5. 更新最后登录信息
        user.setLastLoginIp(ip);
        user.setLastLoginTime(LocalDateTime.now());
        userMapper.updateById(user);

        loginLogService.recordLoginLog(account, ip, userAgent, true, "登录成功");

        return issueTokens(user, loginUser, userAgent);
    }

    /** 注销当前设备会话。 */
    public void logout(String jti) {
        authSessionService.revokeSession(jti);
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
        String refreshJti = claims.get("jti", String.class);
        LoginSession session = authSessionService.consumeRefreshSession(refreshJti);
        if (session == null || !userId.equals(session.getUserId())) {
            throw new BizException(ResultCode.REFRESH_TOKEN_INVALID);
        }
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }
        if (user.getStatus() != null && user.getStatus() == 0) {
            throw new BizException(ResultCode.USER_DISABLED);
        }

        LoginUser loginUser = userDetailsService.refreshCache(user, session.getLoginIp());
        return issueTokens(user, loginUser, session.getUserAgent());
    }

    private LoginResponse issueTokens(SysUser user, LoginUser loginUser, String userAgent) {
        String access = jwtUtil.generateAccessToken(user.getId(), user.getAccount());
        String refresh = jwtUtil.generateRefreshToken(user.getId(), user.getAccount());
        String accessJti = jwtUtil.parse(access).get("jti", String.class);
        String refreshJti = jwtUtil.parse(refresh).get("jti", String.class);
        authSessionService.register(AuthSessionService.of(loginUser, accessJti, refreshJti, userAgent),
                jwtUtil.getAccessExpireSeconds(), jwtUtil.getRefreshExpireSeconds());

        UserInfoDTO userInfo = UserInfoDTO.builder()
                .id(user.getId())
                .account(user.getAccount())
                .nickname(user.getNickname())
                .realName(user.getRealName())
                .avatar(user.getAvatar())
                .email(user.getEmail())
                .phone(user.getPhone())
                .gender(user.getGender())
                .deptId(user.getDeptId())
                .deptName(user.getDeptName())
                .lastLoginTime(user.getLastLoginTime())
                .lastLoginIp(user.getLastLoginIp())
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
