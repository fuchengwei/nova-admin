package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

/** 接口权限直接授权的启用用户选项。 */
@Data
@AllArgsConstructor
@Schema(description = "接口权限可授权用户选项")
public class ApiPermissionUserOptionDTO {

    @JsonSerialize(using = ToStringSerializer.class)
    @Schema(description = "用户 ID")
    private Long id;

    @Schema(description = "显示名称")
    private String label;
}
