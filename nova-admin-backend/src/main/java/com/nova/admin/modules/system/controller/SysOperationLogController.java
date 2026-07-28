package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.system.dto.OperationLogPageQuery;
import com.nova.admin.modules.system.entity.SysOperationLog;
import com.nova.admin.modules.system.service.SysOperationLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 操作日志管理
 */
@Tag(name = "操作日志")
@RestController
@RequestMapping("/system/operation-log")
@Validated
@RequiredArgsConstructor
public class SysOperationLogController extends BaseController {

    private final SysOperationLogService sysOperationLogService;

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('system:log:list')")
    @Operation(summary = "操作日志分页列表")
    public R<PageResult<SysOperationLog>> getOperationLogPage(OperationLogPageQuery query) {
        return ok(sysOperationLogService.getOperationLogPage(query));
    }

    @DeleteMapping("/clean")
    @PreAuthorize("hasAuthority('system:log:remove')")
    @Operation(summary = "按保留期清理操作日志")
    public R<Void> cleanOperationLog(
            @Parameter(description = "日志保留天数", required = true)
            @RequestParam @Min(1) @Max(3650) int retentionDays) {
        sysOperationLogService.purgeOperationLogs(retentionDays);
        return ok();
    }
}
