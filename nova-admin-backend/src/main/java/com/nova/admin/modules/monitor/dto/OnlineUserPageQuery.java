package com.nova.admin.modules.monitor.dto;

import com.nova.admin.common.api.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;

@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "在线用户分页查询")
public class OnlineUserPageQuery extends PageQuery {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "登录账号")
    private String account;

    @Schema(description = "用户昵称")
    private String nickname;

    @Schema(description = "登录 IP")
    private String loginIp;
}
