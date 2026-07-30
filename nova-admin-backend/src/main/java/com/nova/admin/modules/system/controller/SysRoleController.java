package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.system.dto.RoleCreateRequest;
import com.nova.admin.modules.system.dto.RoleDetailDTO;
import com.nova.admin.modules.system.dto.RolePageQuery;
import com.nova.admin.modules.system.dto.RoleUpdateRequest;
import com.nova.admin.modules.system.entity.SysRole;
import com.nova.admin.modules.system.service.SysRoleService;
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

import java.util.List;

/**
 * 角色管理
 */
@Tag(name = "角色管理")
@RestController
@RequestMapping("/system/role")
@RequiredArgsConstructor
public class SysRoleController extends BaseController {

    private final SysRoleService sysRoleService;

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('system:role:list')")
    @Operation(summary = "角色分页列表")
    public R<PageResult<SysRole>> getRolePage(RolePageQuery query) {
        return ok(sysRoleService.getRolePage(query));
    }

    @GetMapping("/all")
    @Operation(summary = "获取所有角色（下拉选择用）")
    public R<List<SysRole>> getAllRoles() {
        return ok(sysRoleService.getAllRoles());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('system:role:list')")
    @Operation(summary = "角色详情")
    public R<RoleDetailDTO> getRoleDetail(@PathVariable Long id) {
        return ok(sysRoleService.getRoleDetail(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('system:role:add')")
    @Operation(summary = "创建角色")
    public R<String> createRole(@Valid @RequestBody RoleCreateRequest req) {
        return ok(String.valueOf(sysRoleService.createRole(req)));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('system:role:edit')")
    @Operation(summary = "更新角色")
    public R<Void> updateRole(@Valid @RequestBody RoleUpdateRequest req) {
        sysRoleService.updateRole(req);
        return ok();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('system:role:remove')")
    @Operation(summary = "删除角色")
    public R<Void> deleteRole(@PathVariable Long id) {
        sysRoleService.deleteRole(id);
        return ok();
    }
}
