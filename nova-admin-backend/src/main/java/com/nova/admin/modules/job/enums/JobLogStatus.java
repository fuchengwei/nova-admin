package com.nova.admin.modules.job.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/** 定时任务执行状态。 */
@Getter
@RequiredArgsConstructor
public enum JobLogStatus {

    SUCCESS(1),
    FAILED(0),
    SKIPPED(2);

    private final int value;
}
