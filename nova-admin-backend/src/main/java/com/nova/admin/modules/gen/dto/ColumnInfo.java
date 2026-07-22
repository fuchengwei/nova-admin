package com.nova.admin.modules.gen.dto;

import lombok.Data;

/** 数据库列信息 */
@Data
public class ColumnInfo {
    private String columnName;
    private String dataType;
    private String columnComment;
    private String javaType;
    private String javaField;
    private boolean pk;
}
