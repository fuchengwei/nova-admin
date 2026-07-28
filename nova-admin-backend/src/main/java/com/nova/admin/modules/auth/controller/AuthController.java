package com.nova.admin.modules.auth.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.security.SecurityUtils;
import com.nova.admin.modules.auth.dto.CaptchaResponse;
import com.nova.admin.modules.auth.dto.LoginRequest;
import com.nova.admin.modules.auth.dto.LoginResponse;
import com.nova.admin.modules.auth.dto.RefreshTokenRequest;
import com.nova.admin.modules.auth.service.AuthService;
import com.nova.admin.modules.auth.service.CaptchaService;
import com.nova.admin.modules.auth.service.AuthSessionEventService;
import com.nova.admin.security.LoginUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 认证 Controller
 */
@Tag(name = "认证")
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController extends BaseController {

    private final AuthService authService;
    private final CaptchaService captchaService;
    private final AuthSessionEventService authSessionEventService;

    @Operation(summary = "获取图形验证码")
    @GetMapping("/captcha")
    public R<CaptchaResponse> captcha() {
        return ok(captchaService.generate());
    }

    @Operation(summary = "登录")
    @PostMapping("/login")
    public R<LoginResponse> login(@Valid @RequestBody LoginRequest req, HttpServletRequest httpReq) {
        return ok(authService.login(req, httpReq));
    }

    @Operation(summary = "刷新 Token")
    @PostMapping("/refresh")
    public R<LoginResponse> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        return ok(authService.refresh(req.getRefreshToken()));
    }

    @Operation(summary = "注销（踢下线）")
    @PostMapping("/logout")
    public R<Void> logout() {
        SecurityUtils.getLoginUser().ifPresent(u -> authService.logout(u.getJti()));
        return ok();
    }

    @Operation(summary = "订阅当前会话撤销通知")
    @GetMapping(value = "/session-events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter sessionEvents() {
        LoginUser loginUser = SecurityUtils.getLoginUser()
                .orElseThrow(() -> new IllegalStateException("未登录"));
        return authSessionEventService.subscribe(loginUser.getJti());
    }
}
