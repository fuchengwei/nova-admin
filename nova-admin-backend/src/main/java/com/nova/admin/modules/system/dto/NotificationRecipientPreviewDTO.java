package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/** 站内消息接收人预览结果。 */
@Data
@Schema(description = "站内消息接收人预览结果")
public class NotificationRecipientPreviewDTO {

    @Schema(description = "实际可接收消息的启用用户数")
    private long recipientCount;

    @Schema(description = "全部可接收用户，用于悬浮查看完整名单")
    private List<NotificationRecipientOptionDTO> samples;
}
