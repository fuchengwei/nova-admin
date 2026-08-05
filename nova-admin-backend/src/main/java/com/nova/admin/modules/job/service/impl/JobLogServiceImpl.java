package com.nova.admin.modules.job.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.job.dto.JobLogPageQuery;
import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.entity.SysJobLog;
import com.nova.admin.modules.job.enums.JobLogStatus;
import com.nova.admin.modules.job.enums.JobTriggerType;
import com.nova.admin.modules.job.mapper.SysJobLogMapper;
import com.nova.admin.modules.job.service.JobLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;

/** 定时任务执行历史服务实现。 */
@Service
@RequiredArgsConstructor
public class JobLogServiceImpl implements JobLogService {

    private static final int ERROR_MESSAGE_LIMIT = 2000;

    private final SysJobLogMapper jobLogMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResult<SysJobLog> getJobLogPage(JobLogPageQuery query) {
        LambdaQueryWrapper<SysJobLog> wrapper = new LambdaQueryWrapper<SysJobLog>()
                .eq(query.getJobId() != null, SysJobLog::getJobId, query.getJobId())
                .like(StringUtils.hasText(query.getJobName()), SysJobLog::getJobName, query.getJobName())
                .eq(StringUtils.hasText(query.getJobGroup()), SysJobLog::getJobGroup, query.getJobGroup())
                .eq(StringUtils.hasText(query.getTriggerType()), SysJobLog::getTriggerType, query.getTriggerType())
                .eq(query.getStatus() != null, SysJobLog::getStatus, query.getStatus())
                .ge(query.getCreateTimeStart() != null, SysJobLog::getStartTime, query.getCreateTimeStart())
                .le(query.getCreateTimeEnd() != null, SysJobLog::getStartTime, query.getCreateTimeEnd())
                .orderByDesc(SysJobLog::getStartTime);
        Page<SysJobLog> result = jobLogMapper.selectPage(
                new Page<>(query.getCurrent(), query.getSize()), wrapper);
        return PageResult.of(result);
    }

    @Override
    @Transactional(readOnly = true)
    public SysJobLog getById(Long id) {
        return jobLogMapper.selectById(id);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public SysJobLog record(SysJob job, JobTriggerType triggerType, JobLogStatus status,
                            LocalDateTime startTime, LocalDateTime endTime, String errorMsg) {
        SysJobLog jobLog = new SysJobLog();
        jobLog.setJobId(job.getId());
        jobLog.setJobName(job.getJobName());
        jobLog.setJobGroup(job.getJobGroup());
        jobLog.setInvokeTarget(job.getInvokeTarget());
        jobLog.setTriggerType(triggerType.name());
        jobLog.setStatus(status.getValue());
        jobLog.setStartTime(startTime);
        jobLog.setEndTime(endTime);
        jobLog.setCostMs(Math.max(0, Duration.between(startTime, endTime).toMillis()));
        jobLog.setErrorMsg(truncate(errorMsg));
        jobLog.setCreateTime(endTime);
        jobLogMapper.insert(jobLog);
        return jobLog;
    }

    private String truncate(String value) {
        if (!StringUtils.hasText(value) || value.length() <= ERROR_MESSAGE_LIMIT) {
            return value;
        }
        return value.substring(0, ERROR_MESSAGE_LIMIT);
    }
}
