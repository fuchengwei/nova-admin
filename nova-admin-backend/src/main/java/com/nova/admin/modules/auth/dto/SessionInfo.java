package com.nova.admin.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Value;

/** 当前用户的登录会话信息。 */
@Value
@Builder
@Schema(description = "登录会话信息")
public class SessionInfo {

    @Schema(description = "访问令牌会话标识")
    String accessJti;

    @Schema(description = "登录 IP")
    String loginIp;

    @Schema(description = "登录时间，Unix 毫秒时间戳")
    Long loginTime;

    @Schema(description = "浏览器 User-Agent")
    String userAgent;

    @Schema(description = "是否为当前会话")
    boolean current;
}
