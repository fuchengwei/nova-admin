package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.time.LocalDateTime;

/** 消息收件明细。 */
@Data
@Schema(description = "消息收件明细")
public class NotificationRecipientRecordDTO {

    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long userId;

    private String account;
    private String nickname;
    private LocalDateTime createTime;
    private LocalDateTime readAt;
    private boolean read;
}
