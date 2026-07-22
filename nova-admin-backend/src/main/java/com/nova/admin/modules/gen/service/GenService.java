package com.nova.admin.modules.gen.service;

import com.nova.admin.modules.gen.dto.TableInfo;

import java.util.List;
import java.util.Map;

public interface GenService {

    List<TableInfo> listTables();

    TableInfo getTableInfo(String tableName);

    /** 预览生成的代码：文件路径 -> 文件内容 */
    Map<String, String> preview(String tableName);

    /** 下载生成代码的 zip 包 */
    byte[] download(String tableName);
}
