package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.system.dto.OperationLogPageQuery;
import com.nova.admin.modules.system.entity.SysOperationLog;
import com.nova.admin.modules.system.mapper.SysOperationLogMapper;
import com.nova.admin.modules.system.service.SysOperationLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 操作日志 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysOperationLogServiceImpl extends ServiceImpl<SysOperationLogMapper, SysOperationLog> implements SysOperationLogService {

    @Override
    public PageResult<SysOperationLog> getOperationLogPage(OperationLogPageQuery query) {
        Page<SysOperationLog> page = new Page<>(query.getCurrent(), query.getSize());

        LambdaQueryWrapper<SysOperationLog> wrapper = new LambdaQueryWrapper<SysOperationLog>()
                .like(query.getModule() != null, SysOperationLog::getModule, query.getModule())
                .like(query.getAction() != null, SysOperationLog::getAction, query.getAction())
                .like(query.getAccount() != null, SysOperationLog::getAccount, query.getAccount())
                .eq(query.getStatus() != null, SysOperationLog::getStatus, query.getStatus())
                .ge(query.getStartTime() != null, SysOperationLog::getCreateTime, query.getStartTime())
                .le(query.getEndTime() != null, SysOperationLog::getCreateTime, query.getEndTime())
                .orderByDesc(SysOperationLog::getCreateTime);

        Page<SysOperationLog> result = page(page, wrapper);
        return PageResult.of(result);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cleanOperationLog() {
        // 物理删除：清空所有操作日志
        baseMapper.delete(new LambdaQueryWrapper<>());
        log.info("清空操作日志成功");
    }
}
