package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
@Schema(description = "上传策略设置")
public class UploadSettingsDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Min(value = 1, message = "通用上传大小不能小于1MB")
    @Max(value = 100, message = "通用上传大小不能大于100MB")
    @Schema(description = "通用最大上传大小（MB）")
    private Integer maxSizeMb;

    @Size(max = 512, message = "允许文件类型长度不能超过512")
    @Schema(description = "通用允许文件类型，逗号分隔 MIME 或扩展名")
    private String allowedTypes;

    @Min(value = 1, message = "头像上传大小不能小于1MB")
    @Max(value = 20, message = "头像上传大小不能大于20MB")
    @Schema(description = "头像最大上传大小（MB）")
    private Integer avatarMaxSizeMb;

    @Size(max = 256, message = "头像允许类型长度不能超过256")
    @Schema(description = "头像允许文件类型，逗号分隔 MIME 或扩展名")
    private String avatarAllowedTypes;
}
