package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/** 接口权限角色分配请求。 */
@Data
@Schema(description = "接口权限角色分配请求")
public class ApiPermissionRoleBindingRequest {

    @NotBlank(message = "权限标识不能为空")
    @Schema(description = "权限标识", example = "system:user:export")
    private String permission;

    @Schema(description = "角色ID列表")
    private List<Long> roleIds;
}
