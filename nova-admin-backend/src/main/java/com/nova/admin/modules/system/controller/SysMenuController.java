package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.system.dto.MenuCreateRequest;
import com.nova.admin.modules.system.dto.MenuTreeDTO;
import com.nova.admin.modules.system.dto.MenuUpdateRequest;
import com.nova.admin.modules.system.service.SysMenuService;
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
 * 菜单管理
 */
@Tag(name = "菜单管理")
@RestController
@RequestMapping("/system/menu")
@RequiredArgsConstructor
public class SysMenuController extends BaseController {

    private final SysMenuService sysMenuService;

    @GetMapping("/tree")
    @PreAuthorize("hasAuthority('system:menu:list')")
    @Operation(summary = "获取菜单树")
    public R<List<MenuTreeDTO>> getMenuTree() {
        return ok(sysMenuService.getMenuTree());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('system:menu:add')")
    @Operation(summary = "创建菜单")
    public R<Long> createMenu(@Valid @RequestBody MenuCreateRequest req) {
        return ok(sysMenuService.createMenu(req));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('system:menu:edit')")
    @Operation(summary = "更新菜单")
    public R<Void> updateMenu(@Valid @RequestBody MenuUpdateRequest req) {
        sysMenuService.updateMenu(req);
        return ok();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('system:menu:remove')")
    @Operation(summary = "删除菜单")
    public R<Void> deleteMenu(@PathVariable Long id) {
        sysMenuService.deleteMenu(id);
        return ok();
    }
}
