package com.nova.admin.modules.job.service;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.job.dto.JobLogPageQuery;
import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.entity.SysJobLog;
import com.nova.admin.modules.job.enums.JobLogStatus;
import com.nova.admin.modules.job.enums.JobTriggerType;

import java.time.LocalDateTime;

/** 定时任务执行历史服务。 */
public interface JobLogService {

    PageResult<SysJobLog> getJobLogPage(JobLogPageQuery query);

    SysJobLog getById(Long id);

    void record(SysJob job, JobTriggerType triggerType, JobLogStatus status,
                LocalDateTime startTime, LocalDateTime endTime, String errorMsg);
}
