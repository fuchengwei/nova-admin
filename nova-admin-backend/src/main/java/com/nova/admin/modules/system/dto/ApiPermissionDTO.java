package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.util.List;

/** 接口权限发现结果。 */
@Data
@Builder
@Schema(description = "接口权限发现结果")
public class ApiPermissionDTO {

    @Schema(description = "权限标识", example = "system:user:export")
    private String permission;

    @Schema(description = "接口权限名称")
    private String name;

    @Schema(description = "状态：REGISTERED 已注册，SYNCABLE 待注册")
    private String status;

    @Schema(description = "关联接口")
    private List<ApiPermissionEndpointDTO> endpoints;

    @JsonSerialize(contentUsing = ToStringSerializer.class)
    @Schema(description = "已分配角色ID列表")
    private List<Long> roleIds;
}
