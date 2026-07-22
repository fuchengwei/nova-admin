package com.nova.admin.modules.gen.dto;

import lombok.Data;

import java.util.List;

/** 表信息（含字段） */
@Data
public class TableInfo {
    private String tableName;
    private String tableComment;
    private String className;
    private String camelName;
    private List<ColumnInfo> columns;
    private ColumnInfo pkColumn;
}
