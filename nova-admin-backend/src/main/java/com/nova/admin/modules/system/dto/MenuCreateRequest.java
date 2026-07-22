package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 创建菜单请求
 */
@Data
@Schema(description = "创建菜单请求")
public class MenuCreateRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @NotNull(message = "父菜单ID不能为空")
    @Schema(description = "父菜单ID，0为根节点")
    private Long parentId;

    @NotBlank(message = "菜单名称不能为空")
    @Size(max = 64, message = "菜单名称长度不能超过64")
    @Schema(description = "菜单名称")
    private String name;

    @NotBlank(message = "菜单类型不能为空")
    @Size(max = 1, message = "菜单类型长度为1")
    @Schema(description = "菜单类型: M目录 C菜单 F按钮")
    private String type;

    @Size(max = 128, message = "权限标识长度不能超过128")
    @Schema(description = "权限标识")
    private String perms;

    @Size(max = 255, message = "路由路径长度不能超过255")
    @Schema(description = "路由路径")
    private String path;

    @Size(max = 255, message = "组件路径长度不能超过255")
    @Schema(description = "组件路径")
    private String component;

    @Size(max = 255, message = "重定向路径长度不能超过255")
    @Schema(description = "重定向路径")
    private String redirect;

    @Size(max = 64, message = "图标长度不能超过64")
    @Schema(description = "图标")
    private String icon;

    @Schema(description = "排序号")
    private Integer sort;

    @Schema(description = "是否显示: 1显示 0隐藏")
    private Integer visible;

    @Schema(description = "状态: 1启用 0停用")
    private Integer status;

    @Schema(description = "是否缓存: 1缓存 0不缓存")
    private Integer keepAlive;

    @Schema(description = "是否总是显示: 1是 0否")
    private Integer alwaysShow;
}
