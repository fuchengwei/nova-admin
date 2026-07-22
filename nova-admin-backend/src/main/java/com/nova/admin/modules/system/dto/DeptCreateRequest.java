package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 创建部门请求
 */
@Data
@Schema(description = "创建部门请求")
public class DeptCreateRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @NotNull(message = "父部门ID不能为空")
    @Schema(description = "父部门ID，0为根节点")
    private Long parentId;

    @NotBlank(message = "部门名称不能为空")
    @Size(max = 64, message = "部门名称长度不能超过64")
    @Schema(description = "部门名称")
    private String name;

    @Size(max = 64, message = "部门编码长度不能超过64")
    @Schema(description = "部门编码")
    private String code;

    @Size(max = 64, message = "负责人长度不能超过64")
    @Schema(description = "负责人")
    private String leader;

    @Size(max = 20, message = "联系电话长度不能超过20")
    @Schema(description = "联系电话")
    private String phone;

    @Size(max = 128, message = "邮箱长度不能超过128")
    @Schema(description = "邮箱")
    private String email;

    @Schema(description = "排序号")
    private Integer sort;

    @NotNull(message = "状态不能为空")
    @Schema(description = "状态：1启用 0停用")
    private Integer status;
}
