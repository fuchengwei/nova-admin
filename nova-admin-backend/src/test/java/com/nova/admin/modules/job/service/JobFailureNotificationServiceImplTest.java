package com.nova.admin.modules.job.service;

import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.entity.SysJobLog;
import com.nova.admin.modules.job.enums.JobTriggerType;
import com.nova.admin.modules.job.service.impl.JobFailureNotificationServiceImpl;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class JobFailureNotificationServiceImplTest {

    @Mock
    private SysUserMapper userMapper;

    @Mock
    private NotificationService notificationService;

    @Test
    void notifyFailure_whenSuperAdminsExist_publishesLinkedJobNotification() {
        JobFailureNotificationService service = new JobFailureNotificationServiceImpl(userMapper, notificationService);
        SysJob job = new SysJob();
        job.setJobName("日报生成");
        SysJobLog jobLog = new SysJobLog();
        jobLog.setId(100L);
        given(userMapper.selectEnabledUserIdsByRoleCode("super_admin")).willReturn(List.of(1L, 2L));

        service.notifyFailure(job, jobLog, JobTriggerType.CRON, "下游服务不可用");

        ArgumentCaptor<String> contentCaptor = ArgumentCaptor.forClass(String.class);
        verify(notificationService).publish(
                org.mockito.ArgumentMatchers.eq("job"),
                org.mockito.ArgumentMatchers.eq("定时任务执行失败"),
                contentCaptor.capture(),
                org.mockito.ArgumentMatchers.eq("/monitor/job?logId=100"),
                org.mockito.ArgumentMatchers.eq(List.of(1L, 2L)));
        assertThat(contentCaptor.getValue()).isEqualTo("任务「日报生成」自动触发失败：下游服务不可用");
    }

    @Test
    void notifyFailure_whenNoSuperAdminExists_doesNotPublish() {
        JobFailureNotificationService service = new JobFailureNotificationServiceImpl(userMapper, notificationService);
        given(userMapper.selectEnabledUserIdsByRoleCode("super_admin")).willReturn(List.of());

        service.notifyFailure(new SysJob(), null, JobTriggerType.MANUAL, "任务失败");

        verifyNoInteractions(notificationService);
    }
}
