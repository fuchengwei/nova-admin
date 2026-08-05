package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/** 接口权限授权范围更新请求。 */
@Data
@Schema(description = "接口权限授权范围更新请求")
public class ApiPermissionAccessBindingRequest {

    @NotBlank(message = "权限标识不能为空")
    @Schema(description = "权限标识", example = "system:user:export")
    private String permission;

    @Schema(description = "是否允许所有已登录用户访问")
    private Boolean publicAccess;

    @Schema(description = "角色ID列表")
    private List<Long> roleIds;

    @Schema(description = "用户ID列表")
    private List<Long> userIds;
}
