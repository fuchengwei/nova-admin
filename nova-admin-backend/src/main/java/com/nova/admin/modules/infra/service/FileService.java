package com.nova.admin.modules.infra.service;

import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.infra.dto.FilePageQuery;
import com.nova.admin.modules.infra.entity.SysFile;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

public interface FileService {

    PageResult<SysFile> getFilePage(FilePageQuery query);

    SysFile upload(MultipartFile file);

    void delete(Long id);

    Resource preview(String objectKey);

    void verifyStorage(String storageType);
}
