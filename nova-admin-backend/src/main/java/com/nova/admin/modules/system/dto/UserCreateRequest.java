package com.nova.admin.modules.system.dto;

import com.nova.admin.common.constant.Constants;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 创建用户请求
 */
@Data
@Schema(description = "创建用户请求")
public class UserCreateRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @NotBlank(message = "用户名不能为空")
    @Size(min = 2, max = 64, message = "用户名长度在2-64之间")
    @Schema(description = "用户名")
    private String username;

    @NotBlank(message = "密码不能为空")
    @Size(min = 6, max = 64, message = "密码长度在6-64之间")
    @Schema(description = "密码")
    private String password;

    @Size(max = 64, message = "昵称长度不能超过64")
    @Schema(description = "昵称")
    private String nickname;

    @Size(max = 64, message = "真实姓名长度不能超过64")
    @Schema(description = "真实姓名")
    private String realName;

    @Size(max = 128, message = "邮箱长度不能超过128")
    @Pattern(regexp = Constants.EMAIL_PATTERN, message = "邮箱格式不正确")
    @Schema(description = "邮箱")
    private String email;

    @Size(max = 20, message = "手机号长度不能超过20")
    @Pattern(regexp = Constants.PHONE_PATTERN, message = "手机号格式不正确")
    @Schema(description = "手机号")
    private String phone;

    @Schema(description = "性别: 0未知 1男 2女")
    private Integer gender;

    @Schema(description = "部门ID")
    private Long deptId;

    @NotNull(message = "状态不能为空")
    @Schema(description = "状态: 1启用 0停用")
    private Integer status;

    @Schema(description = "角色ID列表")
    private List<Long> roleIds;
}
