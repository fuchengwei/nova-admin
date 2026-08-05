package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.time.LocalDateTime;

/** 当前用户的站内消息。 */
@Data
@Schema(description = "站内消息记录")
public class NotificationRecordDTO {

    @Schema(description = "消息 ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Schema(description = "消息类型")
    private String type;

    @Schema(description = "消息标题")
    private String title;

    @Schema(description = "消息正文")
    private String content;

    @Schema(description = "跳转地址")
    private String link;

    @Schema(description = "是否已读")
    private boolean read;

    @Schema(description = "投递时间")
    private LocalDateTime createdAt;
}
