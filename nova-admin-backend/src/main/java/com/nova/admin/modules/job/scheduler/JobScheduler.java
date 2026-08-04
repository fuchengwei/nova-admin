package com.nova.admin.modules.job.scheduler;

import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.enums.JobLogStatus;
import com.nova.admin.modules.job.enums.JobTriggerType;
import com.nova.admin.modules.job.service.JobLogService;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledFuture;

/**
 * 任务调度器：基于 Spring ThreadPoolTaskScheduler 动态注册 cron 任务。
 * 每个任务一个 ScheduledFuture，支持暂停/恢复/立即执行。
 */
@Slf4j
@Component
@lombok.RequiredArgsConstructor
public class JobScheduler implements ApplicationContextAware {

    private final ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
    private final Map<Long, ScheduledFuture<?>> futures = new ConcurrentHashMap<>();
    /** 正在执行（禁止并发）的任务 */
    private final Map<Long, Boolean> running = new ConcurrentHashMap<>();
    private final JobLogService jobLogService;
    private ApplicationContext applicationContext;

    {
        scheduler.setPoolSize(5);
        scheduler.setThreadNamePrefix("nova-job-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(30);
        scheduler.initialize();
    }

    @Override
    public void setApplicationContext(@NonNull ApplicationContext applicationContext) throws BeansException {
        this.applicationContext = applicationContext;
    }

    /** 注册并启动一个任务（仅当状态为运行） */
    public synchronized void schedule(SysJob job) {
        if (job.getStatus() == null || job.getStatus() != 1) {
            return;
        }
        cancel(job.getId());
        validateCron(job.getCronExpression());
        CronTrigger trigger = new CronTrigger(job.getCronExpression());
        ScheduledFuture<?> future = scheduler.schedule(() -> execute(job, JobTriggerType.CRON), trigger);
        futures.put(job.getId(), future);
        log.info("定时任务已启动: id={}, name={}, cron={}", job.getId(), job.getJobName(), job.getCronExpression());
    }

    /** 取消（暂停）任务 */
    public synchronized void cancel(Long jobId) {
        if (jobId == null) {
            log.warn("忽略缺少任务 ID 的取消请求");
            return;
        }
        ScheduledFuture<?> future = futures.remove(jobId);
        if (future != null && !future.isDone()) {
            future.cancel(false);
        }
    }

    /** 立即执行一次 */
    public void runOnce(SysJob job) {
        execute(job, JobTriggerType.MANUAL);
    }

    private void execute(SysJob job, JobTriggerType triggerType) {
        LocalDateTime startTime = LocalDateTime.now();
        if (job.getConcurrent() != null && job.getConcurrent() == 0) {
            if (running.putIfAbsent(job.getId(), Boolean.TRUE) != null) {
                log.warn("任务正在执行，跳过本次调度: id={}", job.getId());
                recordExecution(job, triggerType, JobLogStatus.SKIPPED, startTime, LocalDateTime.now(),
                        "任务正在执行，跳过本次触发");
                return;
            }
        }
        try {
            invoke(job);
            recordExecution(job, triggerType, JobLogStatus.SUCCESS, startTime, LocalDateTime.now(), null);
        } catch (Exception e) {
            log.error("定时任务执行失败: id={}, name={}", job.getId(), job.getJobName(), e);
            recordExecution(job, triggerType, JobLogStatus.FAILED, startTime, LocalDateTime.now(), e.getMessage());
        } finally {
            if (job.getConcurrent() != null && job.getConcurrent() == 0) {
                running.remove(job.getId());
            }
        }
    }

    private void recordExecution(SysJob job, JobTriggerType triggerType, JobLogStatus status,
                                 LocalDateTime startTime, LocalDateTime endTime, String errorMsg) {
        try {
            jobLogService.record(job, triggerType, status, startTime, endTime, errorMsg);
        } catch (Exception e) {
            log.warn("定时任务执行历史记录失败: id={}, name={}", job.getId(), job.getJobName(), e);
        }
    }

    private void invoke(SysJob job) {
        String target = job.getInvokeTarget();
        if (target == null || target.isBlank()) {
            throw new BizException("调用目标为空");
        }
        int dot = target.indexOf('.');
        if (dot <= 0 || dot == target.length() - 1) {
            throw new BizException("调用目标格式错误，应为 beanName.method");
        }
        String beanName = target.substring(0, dot);
        String methodExpr = target.substring(dot + 1);
        String methodName;
        Object[] args = new Object[0];
        int lp = methodExpr.indexOf('(');
        if (lp > 0) {
            methodName = methodExpr.substring(0, lp).trim();
            String argStr = methodExpr.substring(lp + 1, methodExpr.lastIndexOf(')')).trim();
            if (!argStr.isEmpty()) {
                args = new Object[]{argStr.replace("\"", "").replace("'", "")};
            }
        } else {
            methodName = methodExpr.trim();
        }

        Object bean = applicationContext.getBean(beanName);
        try {
            Method method;
            if (args.length == 1) {
                method = bean.getClass().getMethod(methodName, String.class);
            } else {
                method = bean.getClass().getMethod(methodName);
            }
            method.invoke(bean, args);
        } catch (NoSuchMethodException e) {
            throw new BizException("找不到方法 " + methodName + "，bean=" + beanName);
        } catch (InvocationTargetException e) {
            Throwable cause = e.getCause();
            String message = cause == null ? e.getMessage() : cause.getMessage();
            throw new BizException("调用任务方法失败: " + message);
        } catch (Exception e) {
            throw new BizException("调用任务方法失败: " + e.getMessage());
        }
    }

    public static void validateCron(String cron) {
        try {
            CronExpression.parse(cron);
        } catch (Exception e) {
            throw new BizException("cron 表达式不合法: " + cron);
        }
    }

    @PreDestroy
    public void destroy() {
        futures.values().forEach(f -> f.cancel(true));
        scheduler.shutdown();
    }
}
