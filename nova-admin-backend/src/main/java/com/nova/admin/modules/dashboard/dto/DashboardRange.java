package com.nova.admin.modules.dashboard.dto;

import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;

public enum DashboardRange {
    DAYS_7(7),
    DAYS_30(30);

    private final int days;

    DashboardRange(int days) {
        this.days = days;
    }

    public int getDays() {
        return days;
    }

    public static DashboardRange fromValue(String value) {
        return switch (value) {
            case "7d" -> DAYS_7;
            case "30d" -> DAYS_30;
            default -> throw new BizException(ResultCode.BAD_REQUEST);
        };
    }
}
