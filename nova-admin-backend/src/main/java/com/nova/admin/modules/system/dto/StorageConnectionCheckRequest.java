package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
@Schema(description = "文件存储连接检测请求")
public class StorageConnectionCheckRequest {

    @NotBlank(message = "存储类型不能为空")
    @Pattern(regexp = "local|minio", message = "存储类型仅支持 local 或 minio")
    @Schema(description = "待检测的文件存储类型：local 或 minio", example = "minio")
    private String storageType;
}
