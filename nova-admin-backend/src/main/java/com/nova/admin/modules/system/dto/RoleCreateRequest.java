package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 创建角色请求
 */
@Data
@Schema(description = "创建角色请求")
public class RoleCreateRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @NotBlank(message = "角色名称不能为空")
    @Size(max = 64, message = "角色名称长度不能超过64")
    @Schema(description = "角色名称")
    private String name;

    @NotBlank(message = "角色编码不能为空")
    @Size(max = 64, message = "角色编码长度不能超过64")
    @Schema(description = "角色编码")
    private String code;

    @Size(max = 255, message = "描述长度不能超过255")
    @Schema(description = "描述")
    private String description;

    @NotNull(message = "数据权限范围不能为空")
    @Schema(description = "数据权限: 1全部 2本部门及下级 3本部门 4本人及下级 5本人")
    private Integer dataScope;

    @Schema(description = "排序号")
    private Integer sort;

    @NotNull(message = "状态不能为空")
    @Schema(description = "状态: 1启用 0停用")
    private Integer status;

    @Schema(description = "菜单ID列表")
    private List<Long> menuIds;
}
