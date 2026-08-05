package com.nova.admin.modules.job.service.impl;

import com.nova.admin.common.constant.Constants;
import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.entity.SysJobLog;
import com.nova.admin.modules.job.enums.JobTriggerType;
import com.nova.admin.modules.job.service.JobFailureNotificationService;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

/** 定时任务失败时向超级管理员投递站内消息。 */
@Service
@RequiredArgsConstructor
public class JobFailureNotificationServiceImpl implements JobFailureNotificationService {

    private static final String MESSAGE_TYPE = "job";
    private static final String MESSAGE_TITLE = "定时任务执行失败";
    private static final int ERROR_MESSAGE_LIMIT = 500;
    private static final String JOB_PAGE_PATH = "/monitor/job";

    private final SysUserMapper userMapper;
    private final NotificationService notificationService;

    @Override
    public void notifyFailure(SysJob job, SysJobLog jobLog, JobTriggerType triggerType, String errorMessage) {
        List<Long> recipientUserIds = userMapper.selectEnabledUserIdsByRoleCode(Constants.SUPER_ADMIN_ROLE);
        if (recipientUserIds.isEmpty()) {
            return;
        }
        notificationService.publish(
                MESSAGE_TYPE,
                MESSAGE_TITLE,
                buildContent(job, triggerType, errorMessage),
                buildLink(jobLog),
                recipientUserIds);
    }

    private String buildContent(SysJob job, JobTriggerType triggerType, String errorMessage) {
        String triggerLabel = triggerType == JobTriggerType.CRON ? "自动触发" : "手动执行";
        String jobName = StringUtils.hasText(job.getJobName()) ? job.getJobName() : "未命名任务";
        String reason = StringUtils.hasText(errorMessage) ? errorMessage : "未知错误";
        if (reason.length() > ERROR_MESSAGE_LIMIT) {
            reason = reason.substring(0, ERROR_MESSAGE_LIMIT) + "...";
        }
        return "任务「" + jobName + "」" + triggerLabel + "失败：" + reason;
    }

    private String buildLink(SysJobLog jobLog) {
        if (jobLog == null || jobLog.getId() == null) {
            return JOB_PAGE_PATH;
        }
        return JOB_PAGE_PATH + "?logId=" + jobLog.getId();
    }
}
