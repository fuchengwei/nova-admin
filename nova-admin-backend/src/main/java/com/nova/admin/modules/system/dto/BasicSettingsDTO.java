package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
@Schema(description = "基础系统设置")
public class BasicSettingsDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Size(max = 64, message = "系统名称长度不能超过64")
    @Schema(description = "系统名称")
    private String systemName;

    @Size(max = 64, message = "浏览器标题长度不能超过64")
    @Schema(description = "浏览器标题")
    private String browserTitle;

    @Size(max = 512, message = "Logo URL 长度不能超过512")
    @Schema(description = "Logo URL")
    private String logoUrl;

    @Schema(description = "默认语言：zh_CN/en_US")
    @Pattern(regexp = "^(zh_CN|en_US)$", message = "默认语言仅支持 zh_CN 或 en_US")
    private String defaultLanguage;

    @Size(max = 32, message = "主题色长度不能超过32")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "主题色必须为六位十六进制颜色值")
    @Schema(description = "主题色")
    private String themeColor;

    @Size(max = 128, message = "版权文本长度不能超过128")
    @Schema(description = "版权文本")
    private String copyrightText;
}
