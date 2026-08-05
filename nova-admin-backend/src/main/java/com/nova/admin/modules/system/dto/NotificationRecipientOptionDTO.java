package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

/** 站内消息接收对象下拉选项。 */
@Data
@AllArgsConstructor
@Schema(description = "站内消息接收对象选项")
public class NotificationRecipientOptionDTO {

    @JsonSerialize(using = ToStringSerializer.class)
    @Schema(description = "对象 ID")
    private Long id;

    @Schema(description = "显示名称")
    private String label;
}
