package com.nova.admin.modules.job.scheduler;

import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.enums.JobLogStatus;
import com.nova.admin.modules.job.enums.JobTriggerType;
import com.nova.admin.modules.job.service.JobLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationContext;

import java.time.LocalDateTime;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
class JobSchedulerTest {

    @Mock
    private JobLogService jobLogService;

    @Mock
    private ApplicationContext applicationContext;

    private JobScheduler jobScheduler;

    @BeforeEach
    void setUp() {
        jobScheduler = new JobScheduler(jobLogService);
        jobScheduler.setApplicationContext(applicationContext);
    }

    @Test
    void runOnce_whenInvocationSucceeds_recordsSuccessfulManualExecution() {
        SysJob job = job("successTask.run", 1);
        given(applicationContext.getBean("successTask")).willReturn(new SuccessTask());

        jobScheduler.runOnce(job);

        verify(jobLogService).record(eq(job), eq(JobTriggerType.MANUAL), eq(JobLogStatus.SUCCESS),
                any(LocalDateTime.class), any(LocalDateTime.class), isNull());
    }

    @Test
    void runOnce_whenInvocationFails_recordsFailedManualExecution() {
        SysJob job = job("failedTask.run", 1);
        given(applicationContext.getBean("failedTask")).willReturn(new FailedTask());

        jobScheduler.runOnce(job);

        verify(jobLogService).record(eq(job), eq(JobTriggerType.MANUAL), eq(JobLogStatus.FAILED),
                any(LocalDateTime.class), any(LocalDateTime.class), eq("调用任务方法失败: task failed"));
    }

    @Test
    void runOnce_whenConcurrentExecutionIsForbidden_recordsSkippedExecution() throws Exception {
        BlockingTask task = new BlockingTask();
        SysJob job = job("blockingTask.run", 0);
        given(applicationContext.getBean("blockingTask")).willReturn(task);
        Thread firstRun = new Thread(() -> jobScheduler.runOnce(job));
        firstRun.start();
        assertThat(task.started.await(3, TimeUnit.SECONDS)).isTrue();

        jobScheduler.runOnce(job);
        task.release.countDown();
        firstRun.join(3000);

        ArgumentCaptor<JobLogStatus> statusCaptor = ArgumentCaptor.forClass(JobLogStatus.class);
        verify(jobLogService, times(2)).record(eq(job), eq(JobTriggerType.MANUAL), statusCaptor.capture(),
                any(LocalDateTime.class), any(LocalDateTime.class), any());
        assertThat(statusCaptor.getAllValues()).containsExactly(JobLogStatus.SKIPPED, JobLogStatus.SUCCESS);
    }

    private SysJob job(String invokeTarget, int concurrent) {
        SysJob job = new SysJob();
        job.setId(1L);
        job.setJobName("test-job");
        job.setJobGroup("DEFAULT");
        job.setInvokeTarget(invokeTarget);
        job.setConcurrent(concurrent);
        return job;
    }

    public static class SuccessTask {
        public void run() {
        }
    }

    public static class FailedTask {
        public void run() {
            throw new IllegalStateException("task failed");
        }
    }

    public static class BlockingTask {
        private final CountDownLatch started = new CountDownLatch(1);
        private final CountDownLatch release = new CountDownLatch(1);

        public void run() {
            started.countDown();
            try {
                release.await(3, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}
