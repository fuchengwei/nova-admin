package com.nova.admin.modules.system.dto;

import com.nova.admin.modules.system.enums.NotificationRecipientType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.util.List;

/** 可编辑的站内消息草稿。 */
@Data
@Schema(description = "可编辑的站内消息草稿")
public class NotificationDraftDTO {

    @JsonSerialize(using = ToStringSerializer.class)
    @Schema(description = "草稿 ID")
    private Long id;

    @Schema(description = "消息标题")
    private String title;

    @Schema(description = "消息内容")
    private String content;

    @Schema(description = "可选前端路由")
    private String link;

    @Schema(description = "接收范围：ALL、ROLE、USER")
    private NotificationRecipientType recipientType;

    @JsonSerialize(contentUsing = ToStringSerializer.class)
    @Schema(description = "指定角色或用户 ID 列表")
    private List<Long> recipientIds;
}
