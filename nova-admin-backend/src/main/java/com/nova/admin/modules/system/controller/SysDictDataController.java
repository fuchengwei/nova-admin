package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.PageQuery;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.system.dto.DictDataCreateRequest;
import com.nova.admin.modules.system.dto.DictDataUpdateRequest;
import com.nova.admin.modules.system.entity.SysDictData;
import com.nova.admin.modules.system.service.SysDictDataService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 字典数据管理
 */
@Tag(name = "字典数据")
@RestController
@RequestMapping("/system/dict-data")
@RequiredArgsConstructor
public class SysDictDataController extends BaseController {

    private final SysDictDataService sysDictDataService;

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('system:dict:list')")
    @Operation(summary = "字典数据分页列表")
    public R<PageResult<SysDictData>> getDictDataPage(PageQuery query,
                                                       @RequestParam(required = false) Long typeId) {
        return ok(sysDictDataService.getDictDataPage(query, typeId));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('system:dict:add')")
    @Operation(summary = "创建字典数据")
    public R<String> createDictData(@Valid @RequestBody DictDataCreateRequest req) {
        return ok(String.valueOf(sysDictDataService.createDictData(req)));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('system:dict:edit')")
    @Operation(summary = "更新字典数据")
    public R<Void> updateDictData(@Valid @RequestBody DictDataUpdateRequest req) {
        sysDictDataService.updateDictData(req);
        return ok();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('system:dict:remove')")
    @Operation(summary = "删除字典数据")
    public R<Void> deleteDictData(@PathVariable Long id) {
        sysDictDataService.deleteDictData(id);
        return ok();
    }
}
