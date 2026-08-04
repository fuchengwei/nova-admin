package com.nova.admin.modules.job.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/** 定时任务执行历史。 */
@Data
@TableName("sys_job_log")
@Schema(description = "定时任务执行历史")
public class SysJobLog implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    @Schema(description = "执行记录ID")
    private Long id;

    @JsonSerialize(using = ToStringSerializer.class)
    @Schema(description = "任务ID")
    private Long jobId;

    @Schema(description = "任务名称快照")
    private String jobName;

    @Schema(description = "任务分组快照")
    private String jobGroup;

    @Schema(description = "调用目标快照")
    private String invokeTarget;

    @Schema(description = "触发类型：CRON 自动触发，MANUAL 手动执行")
    private String triggerType;

    @Schema(description = "执行状态：1成功，0失败，2跳过")
    private Integer status;

    @Schema(description = "开始时间")
    private LocalDateTime startTime;

    @Schema(description = "结束时间")
    private LocalDateTime endTime;

    @Schema(description = "执行耗时（毫秒）")
    private Long costMs;

    @Schema(description = "失败或跳过原因")
    private String errorMsg;

    @Schema(description = "记录创建时间")
    private LocalDateTime createTime;
}
