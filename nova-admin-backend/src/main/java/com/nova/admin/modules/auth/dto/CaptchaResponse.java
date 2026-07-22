package com.nova.admin.modules.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "图形验证码响应")
public class CaptchaResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "验证码 key（用于提交时校验）")
    private String captchaKey;

    @Schema(description = "Base64 编码的 PNG 图片（含 data:image/png;base64, 前缀）")
    private String captchaImage;

    @Schema(description = "过期时间（秒）")
    private Long expireSeconds;
}
