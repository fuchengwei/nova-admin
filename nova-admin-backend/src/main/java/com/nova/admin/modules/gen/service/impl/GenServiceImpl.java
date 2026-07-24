package com.nova.admin.modules.gen.service.impl;

import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.gen.dto.ColumnInfo;
import com.nova.admin.modules.gen.dto.TableInfo;
import com.nova.admin.modules.gen.mapper.GenMapper;
import com.nova.admin.modules.gen.service.GenService;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.NonNull;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
public class GenServiceImpl implements GenService {

    private final GenMapper genMapper;

    @Override
    public List<TableInfo> listTables() {
        return genMapper.listTables();
    }

    @Override
    public TableInfo getTableInfo(String tableName) {
        TableInfo table = new TableInfo();
        table.setTableName(tableName);
        List<ColumnInfo> cols = genMapper.listColumns(tableName);
        if (cols.isEmpty()) {
            throw new BizException("表不存在或无法读取: " + tableName);
        }
        table.setTableComment(cols.getFirst().getColumnComment());
        for (ColumnInfo c : cols) {
            c.setJavaField(toCamel(c.getColumnName()));
            c.setJavaType(mapJavaType(c.getDataType()));
        }
        table.setColumns(cols);
        table.setPkColumn(cols.stream().filter(ColumnInfo::isPk).findFirst().orElse(null));
        table.setClassName(toClassName(tableName));
        table.setCamelName(toCamel(tableName));
        return table;
    }

    @Override
    public Map<String, String> preview(String tableName) {
        TableInfo table = getTableInfo(tableName);
        String module = moduleOf(tableName);
        String className = table.getClassName();
        String camel = table.getCamelName();
        String base = "com.nova.admin.modules." + module;
        String perm = module + ":" + camel;

        Map<String, String> files = new LinkedHashMap<>();
        files.put("backend/" + module + "/entity/" + className + ".java",
                renderEntity(base, table));
        files.put("backend/" + module + "/mapper/" + className + "Mapper.java",
                renderMapper(base, className));
        files.put("backend/" + module + "/service/" + className + "Service.java",
                renderService(base, className));
        files.put("backend/" + module + "/service/impl/" + className + "ServiceImpl.java",
                renderServiceImpl(base, className));
        files.put("backend/" + module + "/controller/" + className + "Controller.java",
                renderController(base, module, className, camel, perm));
        files.put("frontend/src/api/" + camel + ".ts",
                renderApi(module, camel));
        files.put("frontend/src/pages/" + module + "/" + camel + "/index.tsx",
                renderPage(camel, table));
        return files;
    }

    @Override
    public byte[] download(String tableName) {
        Map<String, String> files = preview(tableName);
        ByteArrayOutputStream zipBuffer = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(zipBuffer)) {
            for (Map.Entry<String, String> entry : files.entrySet()) {
                zos.putNextEntry(new ZipEntry(entry.getKey()));
                zos.write(entry.getValue().getBytes(StandardCharsets.UTF_8));
                zos.closeEntry();
            }
        } catch (Exception e) {
            throw new BizException("生成压缩包失败: " + e.getMessage());
        }
        return zipBuffer.toByteArray();
    }

    private String renderEntity(String base, TableInfo table) {
        StringBuilder sb = new StringBuilder();
        sb.append("package ").append(base).append(".entity;\n\n");
        sb.append("import com.baomidou.mybatisplus.annotation.IdType;\n");
        sb.append("import com.baomidou.mybatisplus.annotation.TableId;\n");
        sb.append("import com.baomidou.mybatisplus.annotation.TableName;\n");
        sb.append("import com.nova.admin.common.base.BaseDO;\n");
        sb.append("import lombok.Data;\nimport lombok.EqualsAndHashCode;\n\n");
        sb.append("/**\n * ").append(table.getTableComment() == null ? table.getTableName() : table.getTableComment()).append("\n */\n");
        sb.append("@Data\n@EqualsAndHashCode(callSuper = true)\n");
        sb.append("@TableName(\"").append(table.getTableName()).append("\")\n");
        sb.append("public class ").append(table.getClassName()).append(" extends BaseDO {\n\n");
        for (ColumnInfo c : table.getColumns()) {
            if (c.isPk()) {
                sb.append("    @TableId(type = IdType.ASSIGN_ID)\n");
            }
            if (c.getColumnComment() != null && !c.getColumnComment().isBlank()) {
                sb.append("    /** ").append(c.getColumnComment()).append(" */\n");
            }
            sb.append("    private ").append(c.getJavaType()).append(" ").append(c.getJavaField()).append(";\n\n");
        }
        sb.append("}\n");
        return sb.toString();
    }

    private String renderMapper(String base, String className) {
        return "package " + base + ".mapper;\n\n"
                + "import com.baomidou.mybatisplus.core.mapper.BaseMapper;\n"
                + "import " + base + ".entity." + className + ";\n\n"
                + "public interface " + className + "Mapper extends BaseMapper<" + className + "> {\n}\n";
    }

    private String renderService(String base, String className) {
        return "package " + base + ".service;\n\n"
                + "import com.baomidou.mybatisplus.extension.service.IService;\n"
                + "import " + base + ".entity." + className + ";\n\n"
                + "public interface " + className + "Service extends IService<" + className + "> {\n}\n";
    }

    private String renderServiceImpl(String base, String className) {
        return "package " + base + ".service.impl;\n\n"
                + "import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;\n"
                + "import " + base + ".entity." + className + ";\n"
                + "import " + base + ".mapper." + className + "Mapper;\n"
                + "import " + base + ".service." + className + "Service;\n"
                + "import lombok.RequiredArgsConstructor;\n"
                + "import org.springframework.stereotype.Service;\n\n"
                + "@Service\n@RequiredArgsConstructor\n"
                + "public class " + className + "ServiceImpl extends ServiceImpl<" + className + "Mapper, " + className + "> implements " + className + "Service {\n}\n";
    }

    private String renderController(String base, String module, String className, String camel, String perm) {
        String req = "/" + module + "/" + camel;
        return "package " + base + ".controller;\n\n"
                + "import com.nova.admin.common.api.R;\n"
                + "import com.nova.admin.common.api.PageResult;\n"
                + "import com.nova.admin.common.base.BaseController;\n"
                + "import com.nova.admin.common.api.PageQuery;\n"
                + "import " + base + ".entity." + className + ";\n"
                + "import " + base + ".service." + className + "Service;\n"
                + "import com.baomidou.mybatisplus.core.metadata.IPage;\n"
                + "import com.baomidou.mybatisplus.extension.plugins.pagination.Page;\n"
                + "import lombok.RequiredArgsConstructor;\n"
                + "import org.springframework.security.access.prepost.PreAuthorize;\n"
                + "import org.springframework.web.bind.annotation.*;\n\n"
                + "@RestController\n@RequestMapping(\"" + req + "\")\n@RequiredArgsConstructor\n"
                + "public class " + className + "Controller extends BaseController {\n\n"
                + "    private final " + className + "Service service;\n\n"
                + "    @GetMapping(\"/page\")\n    @PreAuthorize(\"hasAuthority('" + perm + ":list')\")\n"
                + "    public R<PageResult<" + className + ">> page(PageQuery query) {\n"
                + "        IPage<" + className + "> p = service.page(new Page<>(query.getCurrent(), query.getSize()));\n"
                + "        return ok(PageResult.of(p));\n    }\n\n"
                + "    @GetMapping(\"/{id}\")\n    @PreAuthorize(\"hasAuthority('" + perm + ":list')\")\n"
                + "    public R<" + className + "> detail(@PathVariable Long id) {\n        return ok(service.getById(id));\n    }\n\n"
                + "    @PostMapping\n    @PreAuthorize(\"hasAuthority('" + perm + ":add')\")\n"
                + "    public R<Long> create(@RequestBody " + className + " body) {\n        service.save(body);\n        return ok(body.getId());\n    }\n\n"
                + "    @PutMapping\n    @PreAuthorize(\"hasAuthority('" + perm + ":edit')\")\n"
                + "    public R<Void> update(@RequestBody " + className + " body) {\n        service.updateById(body);\n        return ok();\n    }\n\n"
                + "    @DeleteMapping(\"/{id}\")\n    @PreAuthorize(\"hasAuthority('" + perm + ":remove')\")\n"
                + "    public R<Void> delete(@PathVariable Long id) {\n        service.removeById(id);\n        return ok();\n    }\n}\n";
    }

    private String renderApi(String module, String camel) {
        return "import request from '@/utils/request';\n"
                + "import type { PageResult } from '@/types/common';\n"
                + "import type { R } from '@/types/common';\n\n"
                + "export interface " + cap(camel) + " {\n"
                + "  id?: number;\n}\n\n"
                + "export function get" + cap(camel) + "Page(params: any) {\n"
                + "  return request.get<R<PageResult<" + cap(camel) + ">>>('/" + module + "/" + camel + "/page', { params });\n}\n"
                + "export function get" + cap(camel) + "(id: number) {\n"
                + "  return request.get<R<" + cap(camel) + ">>('/" + module + "/" + camel + "/' + id);\n}\n"
                + "export function create" + cap(camel) + "(data: " + cap(camel) + ") {\n"
                + "  return request.post<R<number>>('/" + module + "/" + camel + "', data);\n}\n"
                + "export function update" + cap(camel) + "(data: " + cap(camel) + ") {\n"
                + "  return request.put<R<void>>('/" + module + "/" + camel + "', data);\n}\n"
                + "export function delete" + cap(camel) + "(id: number) {\n"
                + "  return request.delete<R<void>>('/" + module + "/" + camel + "/' + id);\n}\n";
    }

    private String renderPage(String camel, TableInfo table) {
        StringBuilder sb = new StringBuilder();
        sb.append("import { useState } from 'react';\n");
        sb.append("import { Card, Table, Button, Space, Modal, Form, Input, message } from 'antd';\n");
        sb.append("import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\n");
        sb.append("import { ").append(cap(camel)).append(", get").append(cap(camel)).append("Page, create").append(cap(camel)).append(", update").append(cap(camel)).append(", delete").append(cap(camel)).append(" } from '@/api/").append(camel).append("';\n\n");
        sb.append("export default function ").append(cap(camel)).append("Page() {\n");
        sb.append("  const queryClient = useQueryClient();\n");
        sb.append("  const [pageParams, setPageParams] = useState({ current: 1, size: 10 });\n");
        sb.append("  const { data, isLoading } = useQuery({ queryKey: ['").append(camel).append("Page', pageParams], queryFn: async () => (await get").append(cap(camel)).append("Page(pageParams)).data });\n");
        sb.append("  const columns = [\n");
        for (ColumnInfo c : table.getColumns()) {
            sb.append("    { title: '").append(c.getColumnComment() == null ? c.getJavaField() : c.getColumnComment()).append("', dataIndex: '").append(c.getJavaField()).append("', key: '").append(c.getJavaField()).append("' },\n");
        }
        sb.append("    { title: '操作', key: 'action', render: (_: unknown, record: ").append(cap(camel)).append(") => (\n");
        sb.append("      <Space>\n        <Button type=\"link\" onClick={() => remove.mutate(record.id as number)}>删除</Button>\n      </Space>\n    ) },\n");
        sb.append("  ];\n");
        sb.append("  const remove = useMutation({ mutationFn: delete").append(cap(camel)).append(", onSuccess: (r) => { if (r.code === 0) { message.success('删除成功'); queryClient.invalidateQueries({ queryKey: ['").append(camel).append("Page'] }); } } });\n");
        sb.append("  return (\n    <Card title='").append(table.getTableComment() == null ? table.getTableName() : table.getTableComment()).append("'>\n");
        sb.append("      <Table rowKey=\"id\" columns={columns} dataSource={data?.records ?? []} loading={isLoading}\n        pagination={{ current: data?.current, pageSize: data?.size, total: data?.total, onChange: (p: number, ps: number) => setPageParams({ current: p, size: ps }) }} />\n    </Card>\n  );\n}\n");
        return sb.toString();
    }

    private static String moduleOf(String tableName) {
        int idx = tableName.indexOf('_');
        return idx > 0 ? tableName.substring(0, idx) : tableName;
    }

    private static String toUnderscoreSeparated(String name) {
        StringBuilder sb = new StringBuilder();
        boolean upper = false;
        return getString(name, sb, upper);
    }

    @NonNull
    private static String getString(String name, StringBuilder sb, boolean upper) {
        for (char c : name.toCharArray()) {
            if (c == '_') {
                upper = true;
            } else {
                sb.append(upper ? Character.toUpperCase(c) : c);
                upper = false;
            }
        }
        return sb.toString();
    }

    private static String toClassName(String tableName) {
        StringBuilder sb = new StringBuilder();
        boolean upper = true;
        return getString(tableName, sb, upper);
    }

    private static String toCamel(String name) {
        return toUnderscoreSeparated(name);
    }

    private static String cap(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }

    private static String mapJavaType(String pgType) {
        String t = pgType.toLowerCase();
        if (t.contains("bigint")) return "Long";
        if (t.contains("integer") || t.contains("int") || t.contains("serial")) return "Integer";
        if (t.contains("smallint")) return "Integer";
        if (t.contains("numeric") || t.contains("decimal") || t.contains("money")) return "java.math.BigDecimal";
        if (t.contains("real") || t.contains("float") || t.contains("double")) return "Double";
        if (t.contains("bool")) return "Boolean";
        if (t.contains("timestamp")) return "java.time.LocalDateTime";
        if (t.contains("date")) return "java.time.LocalDate";
        if (t.contains("time")) return "java.time.LocalTime";
        return "String";
    }
}
