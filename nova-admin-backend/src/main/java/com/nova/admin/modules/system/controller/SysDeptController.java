package com.nova.admin.modules.system.controller;

import com.nova.admin.common.base.BaseController;
import com.nova.admin.common.api.R;
import com.nova.admin.modules.system.dto.DeptCreateRequest;
import com.nova.admin.modules.system.dto.DeptTreeDTO;
import com.nova.admin.modules.system.dto.DeptUpdateRequest;
import com.nova.admin.modules.system.service.SysDeptService;
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
 * 部门管理
 */
@Tag(name = "部门管理")
@RestController
@RequestMapping("/system/dept")
@RequiredArgsConstructor
public class SysDeptController extends BaseController {

    private final SysDeptService sysDeptService;

    @GetMapping("/tree")
    @PreAuthorize("hasAuthority('system:dept:list')")
    @Operation(summary = "获取部门树")
    public R<List<DeptTreeDTO>> getDeptTree() {
        return ok(sysDeptService.getDeptTree());
    }

    @GetMapping("/tree/exclude/{id}")
    @PreAuthorize("hasAuthority('system:dept:list')")
    @Operation(summary = "获取排除某节点的部门树")
    public R<List<DeptTreeDTO>> getDeptTreeExclude(@PathVariable Long id) {
        return ok(sysDeptService.getDeptTreeExclude(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('system:dept:add')")
    @Operation(summary = "创建部门")
    public R<String> createDept(@Valid @RequestBody DeptCreateRequest req) {
        return ok(String.valueOf(sysDeptService.createDept(req)));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('system:dept:edit')")
    @Operation(summary = "更新部门")
    public R<Void> updateDept(@Valid @RequestBody DeptUpdateRequest req) {
        sysDeptService.updateDept(req);
        return ok();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('system:dept:remove')")
    @Operation(summary = "删除部门")
    public R<Void> deleteDept(@PathVariable Long id) {
        sysDeptService.deleteDept(id);
        return ok();
    }
}
