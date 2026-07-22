package com.nova.admin.modules.job.task;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 示例任务：可在「定时任务」中通过调用目标 demoJob.execute 触发。
 */
@Slf4j
@Component
public class DemoJob {

    public void execute() {
        log.info("DemoJob.execute 被执行，当前时间：{}", java.time.LocalDateTime.now());
    }

    public void execute(String param) {
        log.info("DemoJob.execute 被执行，参数：{}，时间：{}", param, java.time.LocalDateTime.now());
    }
}
