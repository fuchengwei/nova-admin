package com.nova.admin.modules.system.dto;

import com.nova.admin.modules.system.enums.NotificationRecipientType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/** 站内消息接收人预览请求。 */
@Data
@Schema(description = "站内消息接收人预览请求")
public class NotificationRecipientPreviewRequest {

    @NotNull(message = "请选择接收范围")
    @Schema(description = "接收范围：ALL、ROLE、USER", requiredMode = Schema.RequiredMode.REQUIRED)
    private NotificationRecipientType recipientType;

    @Size(max = 1000, message = "接收对象不能超过1000个")
    @Schema(description = "指定角色或用户 ID 列表")
    private List<Long> recipientIds;
}
