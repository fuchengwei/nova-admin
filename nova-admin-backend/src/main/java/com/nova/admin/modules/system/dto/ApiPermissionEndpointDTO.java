package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/** 受权限保护的接口。 */
@Data
@Builder
@Schema(description = "受权限保护的接口")
public class ApiPermissionEndpointDTO {

    @Schema(description = "HTTP 方法", example = "GET")
    private String method;

    @Schema(description = "接口路径", example = "/system/user/page")
    private String path;

    @Schema(description = "接口说明")
    private String summary;
}
