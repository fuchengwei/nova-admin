package com.nova.admin.modules.infra.controller;

import com.nova.admin.config.NovaProperties;
import com.nova.admin.modules.infra.entity.SysFile;
import com.nova.admin.modules.infra.mapper.SysFileMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 文件预览/下载（公开接口，无需鉴权，objectKey 不可猜测）
 */
@Slf4j
@RestController
@RequestMapping("/file/preview")
public class FilePreviewController {

    private final NovaProperties novaProperties;
    private final SysFileMapper fileMapper;

    public FilePreviewController(NovaProperties novaProperties, SysFileMapper fileMapper) {
        this.novaProperties = novaProperties;
        this.fileMapper = fileMapper;
    }

    @GetMapping("/**")
    public ResponseEntity<Resource> preview(HttpServletRequest request) {
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

        if (!"local".equalsIgnoreCase(novaProperties.getFile().getStorageType())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        SysFile file = fileMapper.selectOne(
                new LambdaQueryWrapper<SysFile>().eq(SysFile::getObjectKey, objectKey));
        if (file == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        Path filePath = Paths.get(novaProperties.getFile().getLocal().getBasePath(), objectKey);
        Resource resource = new FileSystemResource(filePath);
        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        String contentType = file.getContentType() != null && !file.getContentType().isBlank()
                ? file.getContentType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + safeFileName(file.getOriginalName()) + "\"")
                .body(resource);
    }

    private String safeFileName(String name) {
        if (name == null) {
            return "file";
        }
        return name.replace("\"", "");
    }
}
