package com.nova.admin.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
@Schema(description = "登录请求")
public class LoginRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @NotBlank
    @Size(min = 2, max = 64)
    @Schema(description = "账号/手机号/邮箱", example = "admin")
    private String account;

    @NotBlank
    @Size(min = 6, max = 64)
    @Schema(description = "密码", example = "admin123")
    private String password;

    @Schema(description = "图形验证码 key", example = "uuid")
    private String captchaKey;

    @Schema(description = "图形验证码", example = "abcd")
    private String captchaCode;
}
