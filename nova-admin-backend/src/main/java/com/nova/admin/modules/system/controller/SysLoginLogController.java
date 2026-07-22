package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.system.dto.LoginLogPageQuery;
import com.nova.admin.modules.system.entity.SysLoginLog;
import com.nova.admin.modules.system.service.SysLoginLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 登录日志管理
 */
@Tag(name = "登录日志")
@RestController
@RequestMapping("/system/login-log")
@RequiredArgsConstructor
public class SysLoginLogController extends BaseController {

    private final SysLoginLogService sysLoginLogService;

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('system:log:list')")
    @Operation(summary = "登录日志分页列表")
    public R<PageResult<SysLoginLog>> getLoginLogPage(LoginLogPageQuery query) {
        return ok(sysLoginLogService.getLoginLogPage(query));
    }

    @DeleteMapping("/clean")
    @PreAuthorize("hasAuthority('system:log:remove')")
    @Operation(summary = "清空登录日志")
    public R<Void> cleanLoginLog() {
        sysLoginLogService.cleanLoginLog();
        return ok();
    }
}
