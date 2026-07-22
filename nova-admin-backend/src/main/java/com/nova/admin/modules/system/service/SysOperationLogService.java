package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.system.dto.OperationLogPageQuery;
import com.nova.admin.modules.system.entity.SysOperationLog;

/**
 * 操作日志 Service
 */
public interface SysOperationLogService extends IService<SysOperationLog> {

    /**
     * 操作日志分页列表
     */
    PageResult<SysOperationLog> getOperationLogPage(OperationLogPageQuery query);

    /**
     * 清空操作日志
     */
    void cleanOperationLog();
}
