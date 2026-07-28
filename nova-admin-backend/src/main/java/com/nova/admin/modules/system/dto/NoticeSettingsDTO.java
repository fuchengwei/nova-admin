package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
@Schema(description = "通知公告设置")
public class NoticeSettingsDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Size(max = 64, message = "公告标题长度不能超过64")
    @Schema(description = "公告标题")
    private String title;

    @Size(max = 10000, message = "公告内容长度不能超过10000")
    @Schema(description = "公告内容（安全 HTML）")
    private String content;

    @Schema(description = "是否启用公告")
    private Boolean enabled;

    @Schema(description = "公告级别：info/success/warning/error")
    private String level;

    @Schema(description = "是否启用邮件通知")
    private Boolean emailEnabled;

    @Size(max = 128, message = "邮件服务器长度不能超过128")
    @Schema(description = "邮件服务器")
    private String emailHost;

    @Min(value = 1, message = "邮件端口不能小于1")
    @Max(value = 65535, message = "邮件端口不能大于65535")
    @Schema(description = "邮件端口")
    private Integer emailPort;

    @Size(max = 128, message = "邮件账号长度不能超过128")
    @Schema(description = "邮件账号")
    private String emailUsername;

    @Schema(description = "是否启用短信通知")
    private Boolean smsEnabled;

    @Size(max = 64, message = "短信服务商长度不能超过64")
    @Schema(description = "短信服务商")
    private String smsProvider;
}
