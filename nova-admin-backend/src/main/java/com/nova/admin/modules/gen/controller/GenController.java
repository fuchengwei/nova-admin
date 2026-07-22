package com.nova.admin.modules.gen.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.gen.dto.TableInfo;
import com.nova.admin.modules.gen.service.GenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tool/gen")
@RequiredArgsConstructor
public class GenController extends BaseController {

    private final GenService genService;

    @GetMapping("/tables")
    @PreAuthorize("hasAuthority('tool:gen:list')")
    public R<List<TableInfo>> tables() {
        return ok(genService.listTables());
    }

    @GetMapping("/preview/{tableName}")
    @PreAuthorize("hasAuthority('tool:gen:list')")
    public R<Map<String, String>> preview(@PathVariable String tableName) {
        return ok(genService.preview(tableName));
    }

    @GetMapping("/download/{tableName}")
    @PreAuthorize("hasAuthority('tool:gen:list')")
    public ResponseEntity<byte[]> download(@PathVariable String tableName) {
        byte[] zip = genService.download(tableName);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + tableName + "-gen.zip\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zip);
    }
}
