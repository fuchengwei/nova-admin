package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.system.dto.LoginLogPageQuery;
import com.nova.admin.modules.system.entity.SysLoginLog;

/**
 * 登录日志 Service
 */
public interface SysLoginLogService extends IService<SysLoginLog> {

    /**
     * 登录日志分页列表
     */
    PageResult<SysLoginLog> getLoginLogPage(LoginLogPageQuery query);

    /**
     * 清空登录日志
     */
    void cleanLoginLog();

    /**
     * 记录登录日志
     *
     * @param account   账号
     * @param ip        IP地址
     * @param userAgent 用户代理
     * @param success   是否成功
     * @param msg       提示消息
     */
    void recordLoginLog(String username, String ip, String userAgent, boolean success, String msg);
}
