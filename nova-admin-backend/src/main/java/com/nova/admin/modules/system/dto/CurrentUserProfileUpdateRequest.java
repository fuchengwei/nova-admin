package com.nova.admin.modules.system.dto;

import com.nova.admin.common.constant.Constants;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
@Schema(description = "当前用户资料更新请求")
public class CurrentUserProfileUpdateRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

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
}
