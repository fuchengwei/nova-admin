package com.nova.admin.modules.system.dto;

import com.nova.admin.common.api.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/** 消息收件明细分页查询。 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "消息收件明细分页查询")
public class NotificationRecipientPageQuery extends PageQuery {

    @Schema(description = "消息 ID")
    private Long messageId;

    @Schema(description = "阅读状态：true 已读，false 未读")
    private Boolean read;
}
