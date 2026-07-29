package com.nova.admin.modules.infra.controller;

import com.nova.admin.modules.infra.entity.SysFile;
import com.nova.admin.modules.infra.mapper.SysFileMapper;
import com.nova.admin.modules.infra.service.FileService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class FilePreviewControllerTest {

    @Mock
    private SysFileMapper fileMapper;

    @Mock
    private FileService fileService;

    @Test
    void preview_whenDownloadIsRequested_returnsAttachmentDisposition() {
        SysFile file = new SysFile();
        file.setName("2026/07/29/0a7e2f1c3d4b5a6f.xlsx");
        file.setOriginalName("甄零FREE顾问人天确认.xlsx");
        file.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        given(fileMapper.selectOne(any())).willReturn(file);
        given(fileService.preview("2026/07/29/report.xlsx"))
                .willReturn(new ByteArrayResource(new byte[] {1, 2, 3}));
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/file/preview/2026/07/29/report.xlsx");

        var response = new FilePreviewController(fileMapper, fileService).preview(request, true);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
                .startsWith("attachment")
                .contains("filename*=UTF-8''")
                .doesNotContain(file.getOriginalName());
    }
}
