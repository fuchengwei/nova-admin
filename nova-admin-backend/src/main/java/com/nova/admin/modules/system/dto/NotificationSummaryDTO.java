package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/** 当前用户的站内消息摘要。 */
@Data
@Schema(description = "站内消息摘要")
public class NotificationSummaryDTO {

    @Schema(description = "未读数量")
    private long unreadCount;

    @Schema(description = "最近消息")
    private List<NotificationRecordDTO> records;
}
