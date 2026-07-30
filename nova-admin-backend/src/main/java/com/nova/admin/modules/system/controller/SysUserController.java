package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.system.dto.ResetPasswordRequest;
import com.nova.admin.modules.system.dto.UserCreateRequest;
import com.nova.admin.modules.system.dto.UserImportResultDTO;
import com.nova.admin.modules.system.dto.UserPageQuery;
import com.nova.admin.modules.system.dto.UserUpdateRequest;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.service.SysUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * 用户管理
 */
@Tag(name = "用户管理")
@RestController
@RequestMapping("/system/user")
@RequiredArgsConstructor
public class SysUserController extends BaseController {

    private final SysUserService sysUserService;

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('system:user:list')")
    @Operation(summary = "用户分页列表")
    public R<PageResult<SysUser>> getUserPage(UserPageQuery query) {
        return ok(sysUserService.getUserPage(query));
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:user:export')")
    @Operation(summary = "导出用户 Excel")
    public ResponseEntity<ByteArrayResource> exportUsers(UserPageQuery query) {
        return excelAttachment("users.xlsx", sysUserService.exportUsers(query));
    }

    @GetMapping("/import-template")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:user:import')")
    @Operation(summary = "下载用户导入 Excel 模板")
    public ResponseEntity<ByteArrayResource> userImportTemplate() {
        return excelAttachment("user-import-template.xlsx", sysUserService.userImportTemplate());
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:user:import')")
    @Operation(summary = "批量导入用户 Excel")
    public R<UserImportResultDTO> importUsers(
            @Parameter(description = "用户导入 Excel 文件", required = true)
            @RequestParam("file") MultipartFile file) {
        return ok(sysUserService.importUsers(file));
    }

    @PostMapping
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:user:add')")
    @Operation(summary = "创建用户")
    public R<String> createUser(@Valid @RequestBody UserCreateRequest req) {
        return ok(String.valueOf(sysUserService.createUser(req)));
    }

    @PutMapping
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:user:edit')")
    @Operation(summary = "更新用户")
    public R<Void> updateUser(@Valid @RequestBody UserUpdateRequest req) {
        sysUserService.updateUser(req);
        return ok();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:user:remove')")
    @Operation(summary = "删除用户")
    public R<Void> deleteUser(@PathVariable Long id) {
        sysUserService.deleteUser(id);
        return ok();
    }

    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:user:reset-pwd')")
    @Operation(summary = "重置密码")
    public R<Void> resetPassword(@PathVariable Long id, @Valid @RequestBody ResetPasswordRequest body) {
        sysUserService.resetPassword(id, body.getPassword());
        return ok();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:user:edit')")
    @Operation(summary = "更新用户状态")
    public R<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        sysUserService.updateStatus(id, body.get("status"));
        return ok();
    }

    private ResponseEntity<ByteArrayResource> excelAttachment(String fileName, byte[] content) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentLength(content.length)
                .body(new ByteArrayResource(content));
    }
}
