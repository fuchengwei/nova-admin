package com.nova.admin.modules.infra.controller;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.infra.dto.FilePageQuery;
import com.nova.admin.modules.infra.entity.SysFile;
import com.nova.admin.modules.infra.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "文件管理")
@RestController
@RequestMapping("/infra/file")
@RequiredArgsConstructor
public class FileController extends BaseController {

    private final FileService fileService;

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('infra:file:list')")
    @Operation(summary = "文件分页列表")
    public R<PageResult<SysFile>> getFilePage(FilePageQuery query) {
        return ok(fileService.getFilePage(query));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasAuthority('infra:file:upload')")
    @Operation(summary = "上传文件")
    public R<SysFile> upload(@RequestParam("file") MultipartFile file) {
        return ok(fileService.upload(file));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('infra:file:remove')")
    @Operation(summary = "删除文件")
    public R<Void> delete(@PathVariable Long id) {
        fileService.delete(id);
        return ok();
    }
}
