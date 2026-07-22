package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

/**
 * 创建字典数据请求
 */
@Data
@Schema(description = "创建字典数据请求")
public class DictDataCreateRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @NotNull(message = "字典类型ID不能为空")
    @Schema(description = "字典类型ID")
    private Long typeId;

    @NotBlank(message = "字典标签不能为空")
    @Size(max = 128, message = "字典标签长度不能超过128")
    @Schema(description = "字典标签")
    private String label;

    @NotBlank(message = "字典值不能为空")
    @Size(max = 128, message = "字典值长度不能超过128")
    @Schema(description = "字典值")
    private String value;

    @Size(max = 64, message = "CSS样式长度不能超过64")
    @Schema(description = "CSS样式")
    private String cssClass;

    @Schema(description = "排序号")
    private Integer sort;

    @NotNull(message = "状态不能为空")
    @Schema(description = "状态：1启用 0停用")
    private Integer status;

    @Schema(description = "是否默认：1是 0否")
    private Integer defaultFlag;
}
