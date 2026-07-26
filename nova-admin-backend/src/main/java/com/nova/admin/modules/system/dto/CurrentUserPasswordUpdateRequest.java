package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.ToString;

import java.io.Serial;
import java.io.Serializable;

@Data
@Schema(description = "当前用户密码更新请求")
public class CurrentUserPasswordUpdateRequest implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @ToString.Exclude
    @NotBlank(message = "原密码不能为空")
    @Schema(description = "原密码")
    private String oldPassword;

    @ToString.Exclude
    @NotBlank(message = "新密码不能为空")
    @Size(max = 64, message = "新密码长度不能超过64")
    @Schema(description = "新密码")
    private String newPassword;
}
