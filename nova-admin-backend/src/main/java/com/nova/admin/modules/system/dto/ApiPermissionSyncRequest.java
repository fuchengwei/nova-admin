package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/** 接口权限同步请求。 */
@Data
@Schema(description = "接口权限同步请求")
public class ApiPermissionSyncRequest {

    @Size(max = 100, message = "单次最多同步100项权限")
    @Schema(description = "待同步权限标识；为空时同步全部可用项")
    private List<String> permissions;
}
