package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.system.dto.DictTypeCreateRequest;
import com.nova.admin.modules.system.dto.DictTypePageQuery;
import com.nova.admin.modules.system.dto.DictTypeUpdateRequest;
import com.nova.admin.modules.system.entity.SysDictData;
import com.nova.admin.modules.system.entity.SysDictType;
import com.nova.admin.modules.system.service.SysDictTypeService;
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
 * 字典类型管理
 */
@Tag(name = "字典类型")
@RestController
@RequestMapping("/system/dict-type")
@RequiredArgsConstructor
public class SysDictTypeController extends BaseController {

    private final SysDictTypeService sysDictTypeService;

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('system:dict:list')")
    @Operation(summary = "字典类型分页列表")
    public R<PageResult<SysDictType>> getDictTypePage(DictTypePageQuery query) {
        return ok(sysDictTypeService.getDictTypePage(query));
    }

    @GetMapping("/data/{type}")
    @Operation(summary = "根据字典类型编码获取字典数据")
    public R<List<SysDictData>> getDictDataByType(@PathVariable String type) {
        return ok(sysDictTypeService.getDictDataByType(type));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('system:dict:add')")
    @Operation(summary = "创建字典类型")
    public R<String> createDictType(@Valid @RequestBody DictTypeCreateRequest req) {
        return ok(String.valueOf(sysDictTypeService.createDictType(req)));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('system:dict:edit')")
    @Operation(summary = "更新字典类型")
    public R<Void> updateDictType(@Valid @RequestBody DictTypeUpdateRequest req) {
        sysDictTypeService.updateDictType(req);
        return ok();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('system:dict:remove')")
    @Operation(summary = "删除字典类型")
    public R<Void> deleteDictType(@PathVariable Long id) {
        sysDictTypeService.deleteDictType(id);
        return ok();
    }
}
