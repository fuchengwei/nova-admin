package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.PageQuery;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.system.dto.DictDataCreateRequest;
import com.nova.admin.modules.system.dto.DictDataUpdateRequest;
import com.nova.admin.modules.system.entity.SysDictData;
import com.nova.admin.modules.system.mapper.SysDictDataMapper;
import com.nova.admin.modules.system.service.SysDictDataService;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 字典数据 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysDictDataServiceImpl extends ServiceImpl<SysDictDataMapper, SysDictData> implements SysDictDataService {

    @Override
    public PageResult<SysDictData> getDictDataPage(PageQuery query, Long typeId) {
        Page<SysDictData> page = new Page<>(query.getCurrent(), query.getSize());

        LambdaQueryWrapper<SysDictData> wrapper = new LambdaQueryWrapper<SysDictData>()
                .eq(typeId != null, SysDictData::getTypeId, typeId)
                .orderByAsc(SysDictData::getSort);

        Page<SysDictData> result = page(page, wrapper);
        return PageResult.of(result);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createDictData(DictDataCreateRequest req) {
        SysDictData dictData = new SysDictData();
        populateDictDataFields(dictData, req.getTypeId(), req.getLabel(), req.getValue(),
                req.getCssClass(), req.getSort(), req.getStatus(), req.getDefaultFlag());

        Long userId = SecurityUtils.requireUserId();
        dictData.setCreateBy(userId);
        dictData.setUpdateBy(userId);

        save(dictData);
        log.info("创建字典数据成功，id={}, typeId={}, operator={}", dictData.getId(), req.getTypeId(), userId);
        return dictData.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateDictData(DictDataUpdateRequest req) {
        // 检查存在
        SysDictData existing = getById(req.getId());
        if (existing == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "字典数据不存在");
        }

        SysDictData dictData = new SysDictData();
        dictData.setId(req.getId());
        populateDictDataFields(dictData, req.getTypeId(), req.getLabel(), req.getValue(),
                req.getCssClass(), req.getSort(), req.getStatus(), req.getDefaultFlag());

        Long userId = SecurityUtils.requireUserId();
        dictData.setUpdateBy(userId);

        updateById(dictData);
        log.info("更新字典数据成功，id={}, operator={}", req.getId(), userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteDictData(Long id) {
        // 检查存在
        SysDictData existing = getById(id);
        if (existing == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "字典数据不存在");
        }

        // 逻辑删除
        removeById(id);
        Long userId = SecurityUtils.requireUserId();
        log.info("删除字典数据成功，id={}, operator={}", id, userId);
    }

    /**
     * 填充字典数据字段
     */
    private void populateDictDataFields(SysDictData dictData, Long typeId, String label, String value,
                                        String cssClass, Integer sort, Integer status, Integer defaultFlag) {
        dictData.setTypeId(typeId);
        dictData.setLabel(label);
        dictData.setValue(value);
        dictData.setCssClass(cssClass);
        dictData.setSort(sort != null ? sort : 0);
        dictData.setStatus(status);
        dictData.setDefaultFlag(defaultFlag != null ? defaultFlag : 0);
    }
}
