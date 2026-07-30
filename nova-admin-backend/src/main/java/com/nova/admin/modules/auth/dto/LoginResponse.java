package com.nova.admin.modules.auth.dto;

import com.nova.admin.modules.system.dto.UserInfoDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
@Builder
@Schema(description = "登录响应")
public class LoginResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "Token 类型", example = "Bearer")
    private String tokenType;

    @Schema(description = "访问 Token")
    private String accessToken;

    @Schema(description = "刷新 Token")
    private String refreshToken;

    @Schema(description = "访问 Token 过期时间（秒）")
    private Long expiresIn;

    @Schema(description = "是否需要立即修改密码")
    private Boolean passwordChangeRequired;

    @Schema(description = "用户信息")
    private UserInfoDTO userInfo;
}
