package com.nova.admin.common.api;

import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 分页查询条件
 */
@Data
public class PageQuery implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 当前页 */
    private long current = 1L;

    /** 每页条数 */
    private long size = 10L;

    /** 排序字段 */
    private String orderBy;

    /** 排序方向 asc / desc */
    private String orderDirection = "desc";

    /** 关键字（通用模糊搜索） */
    private String keyword;

    /** 创建时间起 */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime createTimeStart;

    /** 创建时间止 */
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime createTimeEnd;
}
