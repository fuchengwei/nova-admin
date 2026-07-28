package com.nova.admin.modules.system.service.impl;

import cn.hutool.http.useragent.UserAgent;
import cn.hutool.http.useragent.UserAgentUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.system.dto.LoginLogPageQuery;
import com.nova.admin.modules.system.entity.SysLoginLog;
import com.nova.admin.modules.system.mapper.SysLoginLogMapper;
import com.nova.admin.modules.system.service.SysLoginLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 登录日志 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysLoginLogServiceImpl extends ServiceImpl<SysLoginLogMapper, SysLoginLog> implements SysLoginLogService {

    private final SysLoginLogMapper loginLogMapper;

    @Override
    public PageResult<SysLoginLog> getLoginLogPage(LoginLogPageQuery query) {
        Page<SysLoginLog> page = new Page<>(query.getCurrent(), query.getSize());

        LambdaQueryWrapper<SysLoginLog> wrapper = new LambdaQueryWrapper<SysLoginLog>()
                .like(query.getAccount() != null, SysLoginLog::getAccount, query.getAccount())
                .eq(query.getStatus() != null, SysLoginLog::getStatus, query.getStatus())
                .ge(query.getStartTime() != null, SysLoginLog::getLoginTime, query.getStartTime())
                .le(query.getEndTime() != null, SysLoginLog::getLoginTime, query.getEndTime())
                .orderByDesc(SysLoginLog::getLoginTime);

        Page<SysLoginLog> result = page(page, wrapper);
        return PageResult.of(result);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void purgeLoginLogs(int retentionDays) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        loginLogMapper.delete(new LambdaQueryWrapper<SysLoginLog>()
                .lt(SysLoginLog::getLoginTime, cutoff));
        log.info("清理登录日志成功，retentionDays={}", retentionDays);
    }

    @Override
    public void recordLoginLog(String account, String ip, String userAgent, boolean success, String msg) {
        SysLoginLog loginLog = new SysLoginLog();
        loginLog.setAccount(account);
        loginLog.setIp(ip);
        loginLog.setUserAgent(userAgent);
        loginLog.setStatus(success ? 1 : 0);
        loginLog.setMsg(msg);
        loginLog.setLoginTime(LocalDateTime.now());

        // 解析 UserAgent 获取 OS 和浏览器信息
        try {
            UserAgent ua = UserAgentUtil.parse(userAgent);
            loginLog.setOs(ua.getOs().getName());
            loginLog.setBrowser(ua.getBrowser().getName());
        } catch (Exception e) {
            log.warn("解析 UserAgent 失败: {}", userAgent, e);
            loginLog.setOs("Unknown");
            loginLog.setBrowser("Unknown");
        }

        save(loginLog);
        log.info("记录登录日志，account={}, ip={}, success={}", account, ip, success);
    }
}
