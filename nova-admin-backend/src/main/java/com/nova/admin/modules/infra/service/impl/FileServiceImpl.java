package com.nova.admin.modules.infra.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.config.NovaProperties;
import com.nova.admin.modules.infra.dto.FilePageQuery;
import com.nova.admin.modules.infra.entity.SysFile;
import com.nova.admin.modules.infra.mapper.SysFileMapper;
import com.nova.admin.modules.infra.service.FileService;
import com.nova.admin.modules.system.service.SysConfigService;
import com.nova.admin.security.SecurityUtils;
import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileServiceImpl extends ServiceImpl<SysFileMapper, SysFile> implements FileService {

    private final NovaProperties novaProperties;
    private final MinioClient minioClient;
    private final SysConfigService sysConfigService;

    @Override
    public PageResult<SysFile> getFilePage(FilePageQuery query) {
        Page<SysFile> page = new Page<>(query.getCurrent(), query.getSize());
        LambdaQueryWrapper<SysFile> wrapper = new LambdaQueryWrapper<SysFile>()
                .like(query.getName() != null, SysFile::getOriginalName, query.getName())
                .like(query.getContentType() != null, SysFile::getContentType, query.getContentType())
                .orderByDesc(SysFile::getCreateTime);
        return PageResult.of(page(page, wrapper));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SysFile upload(MultipartFile file) {
        String originalName = file.getOriginalFilename();
        String contentType = file.getContentType();
        long size = file.getSize();

        // 生成 objectKey: yyyy/MM/dd/uuid.ext
        String ext = "";
        if (originalName != null && originalName.contains(".")) {
            ext = originalName.substring(originalName.lastIndexOf("."));
        }
        LocalDate now = LocalDate.now();
        String objectKey = String.format("%d/%02d/%02d/%s%s",
                now.getYear(), now.getMonthValue(), now.getDayOfMonth(),
                UUID.randomUUID().toString().replace("-", ""), ext);

        String storageType = sysConfigService.getUploadSettings().getStorageType();
        String url;

        if ("minio".equalsIgnoreCase(storageType)) {
            url = uploadToMinio(file, objectKey);
        } else {
            url = uploadToLocal(file, objectKey);
        }

        SysFile sysFile = new SysFile();
        sysFile.setName(objectKey);
        sysFile.setOriginalName(originalName);
        sysFile.setUrl(url);
        sysFile.setSize(size);
        sysFile.setContentType(contentType);
        sysFile.setStorageType(storageType);
        sysFile.setBucket("local".equalsIgnoreCase(storageType) ? null : novaProperties.getFile().getMinio().getBucket());
        sysFile.setObjectKey(objectKey);
        sysFile.setUploaderId(SecurityUtils.requireUserId());
        sysFile.setCreateTime(LocalDateTime.now());
        sysFile.setUpdateTime(LocalDateTime.now());

        save(sysFile);
        log.info("文件上传成功，id={}, objectKey={}, storageType={}", sysFile.getId(), objectKey, storageType);
        return sysFile;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        SysFile sysFile = getById(id);
        if (sysFile == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "文件不存在");
        }

        String storageType = sysFile.getStorageType();
        if ("local".equalsIgnoreCase(storageType)) {
            deleteFromLocal(sysFile.getObjectKey());
        } else if ("minio".equalsIgnoreCase(storageType)) {
            deleteFromMinio(sysFile);
        }

        removeById(id);
        log.info("文件删除成功，id={}, objectKey={}", id, sysFile.getObjectKey());
    }

    @Override
    public Resource preview(String objectKey) {
        SysFile sysFile = getOne(new LambdaQueryWrapper<SysFile>()
                .eq(SysFile::getObjectKey, objectKey));
        if (sysFile == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "文件不存在");
        }
        if ("minio".equalsIgnoreCase(sysFile.getStorageType())) {
            return previewFromMinio(sysFile);
        }
        return previewFromLocal(sysFile.getObjectKey());
    }

    private String uploadToLocal(MultipartFile file, String objectKey) {
        String basePath = novaProperties.getFile().getLocal().getBasePath();
        Path filePath = Paths.get(basePath, objectKey);
        try {
            Files.createDirectories(filePath.getParent());
            file.transferTo(filePath.toFile());
        } catch (IOException e) {
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "文件上传失败");
        }
        return novaProperties.getFile().getLocal().getUrlPrefix() + objectKey;
    }

    private String uploadToMinio(MultipartFile file, String objectKey) {
        String bucket = minioBucket();
        try (InputStream inputStream = file.getInputStream()) {
            ensureMinioBucket(bucket);
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .stream(inputStream, file.getSize(), -1)
                    .contentType(file.getContentType() == null
                            ? "application/octet-stream"
                            : file.getContentType())
                    .build());
            return novaProperties.getFile().getLocal().getUrlPrefix() + objectKey;
        } catch (Exception e) {
            log.error("MinIO 文件上传失败，objectKey={}", objectKey, e);
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "文件上传失败");
        }
    }

    private void deleteFromLocal(String objectKey) {
        Path filePath = Paths.get(novaProperties.getFile().getLocal().getBasePath(), objectKey);
        try {
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.warn("删除本地文件失败: {}", filePath, e);
        }
    }

    private void deleteFromMinio(SysFile sysFile) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(resolveBucket(sysFile))
                    .object(sysFile.getObjectKey())
                    .build());
        } catch (Exception e) {
            log.error("MinIO 文件删除失败，id={}, objectKey={}", sysFile.getId(), sysFile.getObjectKey(), e);
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "文件删除失败");
        }
    }

    private Resource previewFromLocal(String objectKey) {
        Path filePath = Paths.get(novaProperties.getFile().getLocal().getBasePath(), objectKey);
        if (!Files.exists(filePath)) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "文件不存在");
        }
        return new FileSystemResource(filePath);
    }

    private Resource previewFromMinio(SysFile sysFile) {
        try {
            return new InputStreamResource(minioClient.getObject(GetObjectArgs.builder()
                    .bucket(resolveBucket(sysFile))
                    .object(sysFile.getObjectKey())
                    .build()));
        } catch (Exception e) {
            log.error("MinIO 文件读取失败，id={}, objectKey={}", sysFile.getId(), sysFile.getObjectKey(), e);
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "文件读取失败");
        }
    }

    private void ensureMinioBucket(String bucket) throws Exception {
        if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
        }
    }

    private String resolveBucket(SysFile sysFile) {
        return sysFile.getBucket() == null || sysFile.getBucket().isBlank()
                ? minioBucket()
                : sysFile.getBucket();
    }

    private String minioBucket() {
        return novaProperties.getFile().getMinio().getBucket();
    }
}
