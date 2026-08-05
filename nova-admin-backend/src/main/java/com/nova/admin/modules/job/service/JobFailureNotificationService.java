package com.nova.admin.modules.job.service;

import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.entity.SysJobLog;
import com.nova.admin.modules.job.enums.JobTriggerType;

/** 定时任务失败站内通知服务。 */
public interface JobFailureNotificationService {

    /** 向可管理定时任务的超级管理员发送失败通知。 */
    void notifyFailure(SysJob job, SysJobLog jobLog, JobTriggerType triggerType, String errorMessage);
}
