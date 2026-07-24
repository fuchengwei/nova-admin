package com.nova.admin.modules.system.dto;

import com.nova.admin.common.api.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;

/**
 * 用户分页查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "用户分页查询")
public class UserPageQuery extends PageQuery {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "账号")
    private String account;

    @Schema(description = "昵称")
    private String nickname;

    @Schema(description = "手机号")
    private String phone;

    @Schema(description = "状态: 1启用 0停用")
    private Integer status;

    @Schema(description = "部门ID")
    private Long deptId;
}
