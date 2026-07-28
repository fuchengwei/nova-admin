package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.modules.system.dto.ActiveNoticeDTO;
import com.nova.admin.modules.system.dto.BasicSettingsDTO;
import com.nova.admin.modules.system.dto.NoticeSettingsDTO;
import com.nova.admin.modules.system.dto.SecuritySettingsDTO;
import com.nova.admin.modules.system.dto.UploadSettingsDTO;
import com.nova.admin.modules.system.service.SysConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "系统设置")
@RestController
@RequestMapping("/system/config")
@RequiredArgsConstructor
public class SysConfigController extends BaseController {

    private final SysConfigService sysConfigService;

    @GetMapping("/basic")
    @Operation(summary = "获取公开基础设置")
    public R<BasicSettingsDTO> getPublicBasicSettings() {
        return ok(sysConfigService.getBasicSettings());
    }

    @GetMapping("/notice")
    @Operation(summary = "获取当前生效公告")
    public R<ActiveNoticeDTO> getActiveNotice() {
        return ok(sysConfigService.getActiveNotice());
    }

    @GetMapping("/group/{group}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:settings:view')")
    @Operation(summary = "按分组获取系统设置")
    public R<Object> getGroup(@Parameter(description = "配置分组：basic/security/upload/notice", required = true)
                              @PathVariable String group) {
        return ok(switch (group) {
            case "basic" -> sysConfigService.getBasicSettings();
            case "security" -> sysConfigService.getSecuritySettings();
            case "upload" -> sysConfigService.getUploadSettings();
            case "notice" -> sysConfigService.getNoticeSettings();
            default -> throw new BizException(ResultCode.BAD_REQUEST, "不支持的配置分组");
        });
    }

    @PutMapping("/group/basic")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:settings:edit')")
    @Operation(summary = "保存基础设置")
    public R<Void> updateBasic(@Valid @RequestBody BasicSettingsDTO settings) {
        sysConfigService.updateBasicSettings(settings);
        return ok();
    }

    @PutMapping("/group/security")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:settings:edit')")
    @Operation(summary = "保存安全策略设置")
    public R<Void> updateSecurity(@Valid @RequestBody SecuritySettingsDTO settings) {
        sysConfigService.updateSecuritySettings(settings);
        return ok();
    }

    @PutMapping("/group/upload")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:settings:edit')")
    @Operation(summary = "保存上传策略设置")
    public R<Void> updateUpload(@Valid @RequestBody UploadSettingsDTO settings) {
        sysConfigService.updateUploadSettings(settings);
        return ok();
    }

    @PutMapping("/group/notice")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:settings:edit')")
    @Operation(summary = "保存通知公告设置")
    public R<Void> updateNotice(@Valid @RequestBody NoticeSettingsDTO settings) {
        sysConfigService.updateNoticeSettings(settings);
        return ok();
    }
}
