package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 更新字典类型请求
 */
@Data
@Schema(description = "更新字典类型请求")
public class DictTypeUpdateRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @NotNull(message = "ID不能为空")
    @Schema(description = "字典类型ID")
    private Long id;

    @NotBlank(message = "字典类型编码不能为空")
    @Size(max = 128, message = "字典类型编码长度不能超过128")
    @Schema(description = "字典类型编码")
    private String type;

    @NotBlank(message = "字典类型名称不能为空")
    @Size(max = 64, message = "字典类型名称长度不能超过64")
    @Schema(description = "字典类型名称")
    private String name;

    @Size(max = 255, message = "描述长度不能超过255")
    @Schema(description = "描述")
    private String description;

    @NotNull(message = "状态不能为空")
    @Schema(description = "状态：1启用 0停用")
    private Integer status;
}
