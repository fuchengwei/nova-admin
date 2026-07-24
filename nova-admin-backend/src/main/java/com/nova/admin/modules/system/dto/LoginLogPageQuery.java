package com.nova.admin.modules.system.dto;

import com.nova.admin.common.api.PageQuery;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serial;
import java.time.LocalDateTime;

/**
 * 登录日志分页查询条件
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "登录日志分页查询")
public class LoginLogPageQuery extends PageQuery {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "账号")
    private String account;

    @Schema(description = "登录状态: 1成功 0失败")
    private Integer status;

    @Schema(description = "开始时间")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startTime;

    @Schema(description = "结束时间")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endTime;
}
