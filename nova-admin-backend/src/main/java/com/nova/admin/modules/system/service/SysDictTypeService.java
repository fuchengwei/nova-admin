package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.system.dto.DictTypeCreateRequest;
import com.nova.admin.modules.system.dto.DictTypePageQuery;
import com.nova.admin.modules.system.dto.DictTypeUpdateRequest;
import com.nova.admin.modules.system.entity.SysDictData;
import com.nova.admin.modules.system.entity.SysDictType;

import java.util.List;

/**
 * 字典类型 Service
 */
public interface SysDictTypeService extends IService<SysDictType> {

    /**
     * 字典类型分页列表
     */
    PageResult<SysDictType> getDictTypePage(DictTypePageQuery query);

    /**
     * 创建字典类型
     */
    Long createDictType(DictTypeCreateRequest req);

    /**
     * 更新字典类型
     */
    void updateDictType(DictTypeUpdateRequest req);

    /**
     * 删除字典类型（检查是否有关联字典数据）
     */
    void deleteDictType(Long id);

    /**
     * 根据字典类型编码获取字典数据（用于前端下拉选择）
     */
    List<SysDictData> getDictDataByType(String type);
}
