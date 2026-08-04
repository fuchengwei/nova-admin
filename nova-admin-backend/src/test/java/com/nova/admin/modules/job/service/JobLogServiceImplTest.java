package com.nova.admin.modules.job.service;

import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.entity.SysJobLog;
import com.nova.admin.modules.job.enums.JobLogStatus;
import com.nova.admin.modules.job.enums.JobTriggerType;
import com.nova.admin.modules.job.mapper.SysJobLogMapper;
import com.nova.admin.modules.job.service.impl.JobLogServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class JobLogServiceImplTest {

    @Mock
    private SysJobLogMapper jobLogMapper;

    @InjectMocks
    private JobLogServiceImpl jobLogService;

    @Test
    void record_capturesJobSnapshotDurationAndTruncatedReason() {
        SysJob job = new SysJob();
        job.setId(1L);
        job.setJobName("daily-report");
        job.setJobGroup("REPORT");
        job.setInvokeTarget("reportTask.generate");
        LocalDateTime startTime = LocalDateTime.of(2026, 8, 4, 10, 0);
        LocalDateTime endTime = startTime.plusNanos(125_000_000);
        String errorMessage = "x".repeat(2100);

        jobLogService.record(job, JobTriggerType.CRON, JobLogStatus.FAILED, startTime, endTime, errorMessage);

        ArgumentCaptor<SysJobLog> captor = ArgumentCaptor.forClass(SysJobLog.class);
        verify(jobLogMapper).insert(captor.capture());
        SysJobLog log = captor.getValue();
        assertThat(log.getJobId()).isEqualTo(1L);
        assertThat(log.getJobName()).isEqualTo("daily-report");
        assertThat(log.getJobGroup()).isEqualTo("REPORT");
        assertThat(log.getInvokeTarget()).isEqualTo("reportTask.generate");
        assertThat(log.getTriggerType()).isEqualTo("CRON");
        assertThat(log.getStatus()).isEqualTo(JobLogStatus.FAILED.getValue());
        assertThat(log.getCostMs()).isEqualTo(125L);
        assertThat(log.getErrorMsg()).hasSize(2000);
        assertThat(log.getCreateTime()).isEqualTo(endTime);
    }
}
