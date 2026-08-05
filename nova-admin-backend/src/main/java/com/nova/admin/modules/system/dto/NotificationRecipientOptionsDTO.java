package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/** 站内消息可选接收对象。 */
@Data
@Schema(description = "站内消息可选接收对象")
public class NotificationRecipientOptionsDTO {

    @Schema(description = "启用用户")
    private List<NotificationRecipientOptionDTO> users;

    @Schema(description = "启用角色")
    private List<NotificationRecipientOptionDTO> roles;
}
