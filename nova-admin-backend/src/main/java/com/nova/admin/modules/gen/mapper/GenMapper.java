package com.nova.admin.modules.gen.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nova.admin.modules.gen.dto.ColumnInfo;
import com.nova.admin.modules.gen.dto.TableInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface GenMapper {

    @Select("""
            SELECT t.table_name   AS tableName,
                   obj_description((t.table_name)::regclass, 'pg_class') AS tableComment
            FROM information_schema.tables t
            WHERE t.table_schema = (SELECT current_schema())
              AND t.table_type = 'BASE TABLE'
              AND t.table_name NOT LIKE 'qrtz_%'
            ORDER BY t.table_name
            """)
    List<TableInfo> listTables();

    @Select("""
            SELECT c.column_name                                                              AS columnName,
                   c.data_type                                                                AS dataType,
                   col_description((c.table_name)::regclass, c.ordinal_position)              AS columnComment,
                   CASE WHEN pk.col IS NOT NULL THEN true ELSE false END                      AS pk
            FROM information_schema.columns c
                     LEFT JOIN (
                SELECT kcu.column_name AS col, kcu.table_name
                FROM information_schema.table_constraints tc
                         JOIN information_schema.key_column_usage kcu
                              ON tc.constraint_name = kcu.constraint_name AND tc.table_name = kcu.table_name
                WHERE tc.constraint_type = 'PRIMARY KEY'
            ) pk ON pk.col = c.column_name AND pk.table_name = c.table_name
            WHERE c.table_schema = (SELECT current_schema())
              AND c.table_name = #{tableName}
            ORDER BY c.ordinal_position
            """)
    List<ColumnInfo> listColumns(@Param("tableName") String tableName);
}
