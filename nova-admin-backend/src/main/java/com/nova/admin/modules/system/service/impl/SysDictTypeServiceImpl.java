package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.system.dto.DictTypeCreateRequest;
import com.nova.admin.modules.system.dto.DictTypePageQuery;
import com.nova.admin.modules.system.dto.DictTypeUpdateRequest;
import com.nova.admin.modules.system.entity.SysDictData;
import com.nova.admin.modules.system.entity.SysDictType;
import com.nova.admin.modules.system.mapper.SysDictDataMapper;
import com.nova.admin.modules.system.mapper.SysDictTypeMapper;
import com.nova.admin.modules.system.service.SysDictTypeService;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 字典类型 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysDictTypeServiceImpl extends ServiceImpl<SysDictTypeMapper, SysDictType> implements SysDictTypeService {

    private final SysDictDataMapper dictDataMapper;

    @Override
    public PageResult<SysDictType> getDictTypePage(DictTypePageQuery query) {
        Page<SysDictType> page = new Page<>(query.getCurrent(), query.getSize());

        LambdaQueryWrapper<SysDictType> wrapper = new LambdaQueryWrapper<SysDictType>()
                .like(query.getType() != null, SysDictType::getType, query.getType())
                .like(query.getName() != null, SysDictType::getName, query.getName())
                .eq(query.getStatus() != null, SysDictType::getStatus, query.getStatus())
                .orderByDesc(SysDictType::getCreateTime);

        Page<SysDictType> result = page(page, wrapper);
        return PageResult.of(result);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createDictType(DictTypeCreateRequest req) {
        // 检查字典类型编码唯一
        checkDictTypeUnique(null, req.getType());

        SysDictType dictType = new SysDictType();
        dictType.setType(req.getType());
        dictType.setName(req.getName());
        dictType.setDescription(req.getDescription());
        dictType.setStatus(req.getStatus());

        Long userId = SecurityUtils.requireUserId();
        dictType.setCreateBy(userId);
        dictType.setUpdateBy(userId);

        save(dictType);
        log.info("创建字典类型成功，id={}, type={}, operator={}", dictType.getId(), dictType.getType(), userId);
        return dictType.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateDictType(DictTypeUpdateRequest req) {
        // 检查存在
        SysDictType existing = getById(req.getId());
        if (existing == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "字典类型不存在");
        }

        // 检查字典类型编码唯一（排除自身）
        checkDictTypeUnique(req.getId(), req.getType());

        SysDictType dictType = new SysDictType();
        dictType.setId(req.getId());
        dictType.setType(req.getType());
        dictType.setName(req.getName());
        dictType.setDescription(req.getDescription());
        dictType.setStatus(req.getStatus());

        Long userId = SecurityUtils.requireUserId();
        dictType.setUpdateBy(userId);

        updateById(dictType);
        log.info("更新字典类型成功，id={}, operator={}", req.getId(), userId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteDictType(Long id) {
        // 检查存在
        SysDictType existing = getById(id);
        if (existing == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "字典类型不存在");
        }

        // 检查是否有关联字典数据
        long dataCount = dictDataMapper.selectCount(new LambdaQueryWrapper<SysDictData>()
                .eq(SysDictData::getTypeId, id));
        if (dataCount > 0) {
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "该字典类型下存在关联字典数据，无法删除");
        }

        // 逻辑删除
        removeById(id);
        Long userId = SecurityUtils.requireUserId();
        log.info("删除字典类型成功，id={}, operator={}", id, userId);
    }

    @Override
    public List<SysDictData> getDictDataByType(String type) {
        // 先通过 type 编码查到字典类型
        SysDictType dictType = getOne(new LambdaQueryWrapper<SysDictType>()
                .eq(SysDictType::getType, type));
        if (dictType == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "字典类型不存在");
        }

        // 再查字典数据（仅启用状态）
        return dictDataMapper.selectByTypeId(dictType.getId()).stream()
                .filter(d -> d.getStatus() != null && d.getStatus() == 1)
                .toList();
    }

    // ==================== 私有方法 ====================

    /**
     * 检查字典类型编码唯一
     */
    private void checkDictTypeUnique(Long excludeId, String type) {
        LambdaQueryWrapper<SysDictType> wrapper = new LambdaQueryWrapper<SysDictType>()
                .eq(SysDictType::getType, type);
        if (excludeId != null) {
            wrapper.ne(SysDictType::getId, excludeId);
        }
        long count = count(wrapper);
        if (count > 0) {
            throw new BizException(ResultCode.DATA_EXISTS, "字典类型编码已存在");
        }
    }
}
