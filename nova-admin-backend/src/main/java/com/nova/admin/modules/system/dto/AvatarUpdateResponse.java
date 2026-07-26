package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;

@Data
@Builder
@Schema(description = "头像更新响应")
public class AvatarUpdateResponse implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "头像 URL")
    private String avatar;
}
