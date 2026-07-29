package com.nova.admin.modules.infra.service;

import com.nova.admin.config.NovaProperties;
import com.nova.admin.modules.infra.entity.SysFile;
import com.nova.admin.modules.infra.service.impl.FileServiceImpl;
import com.nova.admin.modules.system.dto.UploadSettingsDTO;
import com.nova.admin.modules.system.service.SysConfigService;
import com.nova.admin.security.LoginUser;
import com.nova.admin.security.SecurityUser;
import io.minio.GetObjectResponse;
import io.minio.MinioClient;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.InputStreamResource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class FileServiceImplTest {

    @Mock
    private MinioClient minioClient;

    @Mock
    private SysConfigService sysConfigService;

    private FileServiceImpl fileService;

    @BeforeEach
    void setUp() {
        fileService = spy(new FileServiceImpl(novaProperties(), minioClient, sysConfigService));
        SecurityUser principal = new SecurityUser(LoginUser.builder()
                .userId(1L)
                .account("admin")
                .roles(Set.of("super_admin"))
                .build(), "password");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void upload_whenMinioIsSelected_createsBucketAndPersistsProxyPreviewUrl() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.png", "image/png", new byte[] {1, 2, 3});
        given(sysConfigService.getUploadSettings()).willReturn(uploadSettings("minio"));
        given(minioClient.bucketExists(any())).willReturn(false);
        doReturn(true).when(fileService).save(any(SysFile.class));

        SysFile uploaded = fileService.upload(file);

        ArgumentCaptor<SysFile> fileCaptor = ArgumentCaptor.forClass(SysFile.class);
        verify(fileService).save(fileCaptor.capture());
        verify(minioClient).makeBucket(any());
        verify(minioClient).putObject(any());
        assertThat(uploaded.getStorageType()).isEqualTo("minio");
        assertThat(uploaded.getBucket()).isEqualTo("nova-admin");
        assertThat(uploaded.getUrl()).startsWith("http://localhost:8080/api/file/preview/");
        assertThat(fileCaptor.getValue().getUploaderId()).isEqualTo(1L);
    }

    @Test
    void delete_whenFileIsStoredInMinio_removesObjectBeforeDeletingRecord() throws Exception {
        SysFile file = minioFile();
        doReturn(file).when(fileService).getById(1L);
        doReturn(true).when(fileService).removeById(1L);

        fileService.delete(1L);

        verify(minioClient).removeObject(any());
        verify(fileService).removeById(1L);
    }

    @Test
    void preview_whenFileIsStoredInMinio_readsObjectFromItsStoredBucket() throws Exception {
        doReturn(minioFile()).when(fileService).getOne(any());
        given(minioClient.getObject(any())).willReturn(org.mockito.Mockito.mock(GetObjectResponse.class));

        var resource = fileService.preview("2026/07/29/avatar.png");

        verify(minioClient).getObject(any());
        assertThat(resource).isInstanceOf(InputStreamResource.class);
    }

    private NovaProperties novaProperties() {
        NovaProperties properties = new NovaProperties();
        properties.getFile().setStorageType("local");
        properties.getFile().getLocal().setBasePath("/tmp/nova-admin-test");
        properties.getFile().getLocal().setUrlPrefix("http://localhost:8080/api/file/preview/");
        properties.getFile().getMinio().setEndpoint("http://localhost:9000");
        properties.getFile().getMinio().setAccessKey("access-key");
        properties.getFile().getMinio().setSecretKey("secret-key");
        properties.getFile().getMinio().setBucket("nova-admin");
        return properties;
    }

    private SysFile minioFile() {
        SysFile file = new SysFile();
        file.setId(1L);
        file.setStorageType("minio");
        file.setBucket("nova-admin");
        file.setObjectKey("2026/07/29/avatar.png");
        return file;
    }

    private UploadSettingsDTO uploadSettings(String storageType) {
        UploadSettingsDTO settings = new UploadSettingsDTO();
        settings.setStorageType(storageType);
        return settings;
    }
}
