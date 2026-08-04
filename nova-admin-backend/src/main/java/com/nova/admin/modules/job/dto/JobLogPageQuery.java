package com.nova.admin.modules.job.dto;

import com.nova.admin.common.api.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

/** 定时任务执行历史分页查询条件。 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "定时任务执行历史分页查询")
public class JobLogPageQuery extends PageQuery {

    @JsonSerialize(using = ToStringSerializer.class)
    @Schema(description = "任务ID")
    private Long jobId;

    @Schema(description = "任务名称")
    private String jobName;

    @Schema(description = "任务分组")
    private String jobGroup;

    @Schema(description = "触发类型：CRON 或 MANUAL")
    private String triggerType;

    @Schema(description = "执行状态：1成功，0失败，2跳过")
    private Integer status;
}
