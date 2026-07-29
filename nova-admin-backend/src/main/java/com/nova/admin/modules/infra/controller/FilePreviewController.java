package com.nova.admin.modules.infra.controller;

import com.nova.admin.modules.infra.entity.SysFile;
import com.nova.admin.modules.infra.mapper.SysFileMapper;
import com.nova.admin.modules.infra.service.FileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ContentDisposition;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.servlet.http.HttpServletRequest;

import java.nio.charset.StandardCharsets;

/**
 * 文件预览/下载（公开接口，无需鉴权，objectKey 不可猜测）
 */
@Slf4j
@Tag(name = "文件管理")
@RestController
@RequestMapping("/file/preview")
public class FilePreviewController {

    private final SysFileMapper fileMapper;
    private final FileService fileService;

    public FilePreviewController(SysFileMapper fileMapper, FileService fileService) {
        this.fileMapper = fileMapper;
        this.fileService = fileService;
    }

    @GetMapping("/**")
    @Operation(summary = "预览或下载文件")
    public ResponseEntity<Resource> preview(
            HttpServletRequest request,
            @io.swagger.v3.oas.annotations.Parameter(description = "是否作为附件下载")
            @RequestParam(defaultValue = "false") boolean download) {
        String requestUri = request.getRequestURI();
        String prefix = request.getContextPath() + "/file/preview/";
        if (!requestUri.startsWith(prefix) || requestUri.length() == prefix.length()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        // objectKey 形如 2026/07/22/uuid.ext（含多级目录）
        String objectKey = requestUri.substring(prefix.length());
        if (objectKey.isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        SysFile file = fileMapper.selectOne(
                new LambdaQueryWrapper<SysFile>().eq(SysFile::getObjectKey, objectKey));
        if (file == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Resource resource;
        try {
            resource = fileService.preview(objectKey);
        } catch (Exception e) {
            log.warn("预览文件失败，objectKey={}", objectKey, e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String contentType = file.getContentType() != null && !file.getContentType().isBlank()
                ? file.getContentType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.builder(download ? "attachment" : "inline")
                                .filename(safeFileName(file.getOriginalName()), StandardCharsets.UTF_8)
                                .build()
                                .toString())
                .body(resource);
    }

    private String safeFileName(String name) {
        if (name == null) {
            return "file";
        }
        return name.replace("\"", "").replace("\r", "").replace("\n", "");
    }
}
