package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.nova.admin.common.api.PageQuery;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.system.dto.DictDataCreateRequest;
import com.nova.admin.modules.system.dto.DictDataUpdateRequest;
import com.nova.admin.modules.system.entity.SysDictData;

/**
 * 字典数据 Service
 */
public interface SysDictDataService extends IService<SysDictData> {

    /**
     * 字典数据分页列表
     */
    PageResult<SysDictData> getDictDataPage(PageQuery query, Long typeId);

    /**
     * 创建字典数据
     */
    Long createDictData(DictDataCreateRequest req);

    /**
     * 更新字典数据
     */
    void updateDictData(DictDataUpdateRequest req);

    /**
     * 删除字典数据
     */
    void deleteDictData(Long id);
}
