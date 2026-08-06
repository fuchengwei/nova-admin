package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.time.LocalDateTime;

/** 消息发布记录摘要。 */
@Data
@Schema(description = "消息发布记录摘要")
public class NotificationRecordSummaryDTO {

    @JsonSerialize(using = ToStringSerializer.class)
    @Schema(description = "消息 ID")
    private Long id;

    private String type;
    private String title;
    private String content;
    private String link;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long publisherId;

    private String publisherName;
    private String status;
    private LocalDateTime scheduledAt;
    private String errorMsg;
    private LocalDateTime createTime;
    private long recipientCount;
    private long readCount;
    private long unreadCount;
}
