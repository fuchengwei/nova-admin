package com.nova.admin.modules.system.dto;

import com.nova.admin.modules.system.enums.NotificationRecipientType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/** 站内消息发布请求。 */
@Data
@Schema(description = "站内消息发布请求")
public class NotificationPublishRequest {

    @NotBlank(message = "消息标题不能为空")
    @Size(max = 200, message = "消息标题不能超过200个字符")
    @Schema(description = "消息标题")
    private String title;

    @NotBlank(message = "消息内容不能为空")
    @Size(max = 5000, message = "消息内容不能超过5000个字符")
    @Schema(description = "消息内容")
    private String content;

    @Size(max = 500, message = "跳转链接不能超过500个字符")
    @Schema(description = "可选前端路由")
    private String link;

    @NotNull(message = "请选择接收范围")
    @Schema(description = "接收范围：ALL、ROLE、USER")
    private NotificationRecipientType recipientType;

    @Schema(description = "指定角色或用户 ID 列表")
    private List<Long> recipientIds;
}
