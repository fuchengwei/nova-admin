package com.nova.admin.modules.dashboard.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Schema(description = "首页仪表盘概览")
public class DashboardOverviewDTO {

    @Schema(description = "业务规模统计")
    private Section<Stats> stats;

    @Schema(description = "登录和操作趋势")
    private Section<List<TrendPoint>> trend;

    @Schema(description = "运行状态")
    private Section<Runtime> runtime;

    @Schema(description = "最近动态")
    private Section<List<Activity>> activities;

    @Schema(description = "概览生成时间")
    private LocalDateTime updatedAt;

    @Data
    @Schema(description = "仪表盘区块")
    public static class Section<T> {
        @Schema(description = "区块数据是否可用")
        private boolean available;

        @Schema(description = "区块数据")
        private T data;
    }

    @Data
    @Schema(description = "业务规模统计")
    public static class Stats {
        private long userCount;
        private long roleCount;
        private long deptCount;
        private long fileCount;
        private long jobCount;
    }

    @Data
    @Schema(description = "每日趋势数据")
    public static class TrendPoint {
        private String date;
        private long loginCount;
        private long operationCount;
    }

    @Data
    @Schema(description = "运行状态")
    public static class Runtime {
        private String appName;
        private String version;
        private boolean online;
        private long onlineUserCount;
        private Double cpuUsage;
        private Double memoryUsage;
        private Double jvmUsage;
    }

    @Data
    @Schema(description = "最近动态")
    public static class Activity {
        private String type;
        private String account;
        private String summary;
        private LocalDateTime occurredAt;
        private Integer status;
    }
}
