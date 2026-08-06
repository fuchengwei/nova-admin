package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.time.LocalDateTime;

/** 消息发布结果。 */
@Data
@Schema(description = "消息发布结果")
public class NotificationPublishResultDTO {

    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String status;
    private int recipientCount;
    private LocalDateTime scheduledAt;
}
