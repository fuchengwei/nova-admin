package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;
import lombok.Builder;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 角色详情（含菜单ID列表）
 */
@Data
@Builder
@Schema(description = "角色详情")
public class RoleDetailDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "角色ID")
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    @Schema(description = "角色名称")
    private String name;

    @Schema(description = "角色编码")
    private String code;

    @Schema(description = "描述")
    private String description;

    @Schema(description = "数据权限: 1全部 2本部门及下级 3本部门 4本人及下级 5本人")
    private Integer dataScope;

    @Schema(description = "排序号")
    private Integer sort;

    @Schema(description = "状态: 1启用 0停用")
    private Integer status;

    @Schema(description = "创建时间")
    private LocalDateTime createTime;

    @Schema(description = "更新时间")
    private LocalDateTime updateTime;

    @Schema(description = "菜单ID列表")
    @JsonSerialize(contentUsing = ToStringSerializer.class)
    private List<Long> menuIds;
}
