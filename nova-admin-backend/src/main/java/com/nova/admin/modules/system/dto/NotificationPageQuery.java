package com.nova.admin.modules.system.dto;

import com.nova.admin.common.api.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/** 站内消息发布记录分页查询。 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "站内消息发布记录分页查询")
public class NotificationPageQuery extends PageQuery {

    @Schema(description = "消息标题")
    private String title;

    @Schema(description = "消息类型")
    private String type;

    @Schema(description = "消息状态：DRAFT、SCHEDULED、SENDING、SENT、CANCELED、FAILED")
    private String status;
}
