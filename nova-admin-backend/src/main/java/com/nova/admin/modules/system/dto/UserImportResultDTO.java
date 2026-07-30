package com.nova.admin.modules.system.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

@Data
@Schema(description = "用户批量导入结果")
public class UserImportResultDTO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Schema(description = "处理总行数")
    private int total;

    @Schema(description = "成功导入行数")
    private int success;

    @Schema(description = "失败行数")
    private int failed;

    @Schema(description = "失败明细，最多返回 100 条")
    private List<String> errors;
}
