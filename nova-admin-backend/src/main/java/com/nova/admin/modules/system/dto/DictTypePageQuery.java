package com.nova.admin.modules.system.dto;

import com.nova.admin.common.api.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;

/**
 * 字典类型分页查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "字典类型分页查询")
public class DictTypePageQuery extends PageQuery {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "字典类型编码")
    private String type;

    @Schema(description = "字典类型名称")
    private String name;

    @Schema(description = "状态: 1启用 0停用")
    private Integer status;
}
