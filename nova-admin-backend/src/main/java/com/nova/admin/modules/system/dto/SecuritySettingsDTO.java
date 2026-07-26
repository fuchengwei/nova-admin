package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
@Schema(description = "安全策略设置")
public class SecuritySettingsDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Min(value = 6, message = "密码最小长度不能小于6")
    @Max(value = 64, message = "密码最小长度不能大于64")
    @Schema(description = "密码最小长度")
    private Integer passwordMinLength;

    @Schema(description = "是否要求包含数字")
    private Boolean passwordRequireNumber;

    @Schema(description = "是否要求包含字母")
    private Boolean passwordRequireLetter;

    @Schema(description = "是否要求包含特殊字符")
    private Boolean passwordRequireSpecial;

    @Min(value = 1, message = "登录失败锁定次数不能小于1")
    @Max(value = 20, message = "登录失败锁定次数不能大于20")
    @Schema(description = "登录失败锁定次数")
    private Integer loginLockMaxAttempts;

    @Min(value = 1, message = "锁定分钟数不能小于1")
    @Max(value = 1440, message = "锁定分钟数不能大于1440")
    @Schema(description = "锁定分钟数")
    private Integer loginLockMinutes;

    @Schema(description = "是否启用验证码")
    private Boolean captchaEnabled;

    @Min(value = 5, message = "访问 Token 有效期不能小于5分钟")
    @Max(value = 1440, message = "访问 Token 有效期不能大于1440分钟")
    @Schema(description = "访问 Token 有效期（分钟）")
    private Integer accessTokenExpireMinutes;

    @Min(value = 60, message = "刷新 Token 有效期不能小于60分钟")
    @Max(value = 43200, message = "刷新 Token 有效期不能大于43200分钟")
    @Schema(description = "刷新 Token 有效期（分钟）")
    private Integer refreshTokenExpireMinutes;
}
