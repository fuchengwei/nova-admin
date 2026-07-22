package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.system.dto.UserCreateRequest;
import com.nova.admin.modules.system.dto.UserPageQuery;
import com.nova.admin.modules.system.dto.UserUpdateRequest;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.service.SysUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    @PostMapping
    @PreAuthorize("hasAuthority('system:user:add')")
    @Operation(summary = "创建用户")
    public R<Long> createUser(@Valid @RequestBody UserCreateRequest req) {
        return ok(sysUserService.createUser(req));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('system:user:edit')")
    @Operation(summary = "更新用户")
    public R<Void> updateUser(@Valid @RequestBody UserUpdateRequest req) {
        sysUserService.updateUser(req);
        return ok();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('system:user:remove')")
    @Operation(summary = "删除用户")
    public R<Void> deleteUser(@PathVariable Long id) {
        sysUserService.deleteUser(id);
        return ok();
    }

    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasAuthority('system:user:reset-pwd')")
    @Operation(summary = "重置密码")
    public R<Void> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> body) {
        sysUserService.resetPassword(id, body.get("password"));
        return ok();
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAuthority('system:user:edit')")
    @Operation(summary = "更新用户状态")
    public R<Void> updateStatus(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        sysUserService.updateStatus(id, body.get("status"));
        return ok();
    }
}
