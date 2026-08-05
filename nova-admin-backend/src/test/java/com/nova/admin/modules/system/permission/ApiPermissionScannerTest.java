package com.nova.admin.modules.system.permission;

import com.nova.admin.modules.system.dto.ApiPermissionEndpointDTO;
import io.swagger.v3.oas.annotations.Operation;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.springframework.web.method.HandlerMethod;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;

class ApiPermissionScannerTest {

    @Test
    void scan_extractsAuthorityAndEndpointMetadata() throws Exception {
        RequestMappingHandlerMapping mapping = mock(RequestMappingHandlerMapping.class);
        ObjectProvider<RequestMappingHandlerMapping> provider = mock(ObjectProvider.class);
        Method method = DemoController.class.getMethod("export");
        RequestMappingInfo mappingInfo = RequestMappingInfo.paths("/system/user/export")
                .methods(RequestMethod.GET)
                .build();
        given(provider.getObject()).willReturn(mapping);
        given(mapping.getHandlerMethods()).willReturn(Map.of(
                mappingInfo, new HandlerMethod(new DemoController(), method)));

        ApiPermissionScanner scanner = new ApiPermissionScanner(provider);

        Map<String, List<ApiPermissionEndpointDTO>> result = scanner.scan();

        assertThat(result).containsKey("system:user:export");
        assertThat(result.get("system:user:export")).singleElement().satisfies(endpoint -> {
            assertThat(endpoint.getMethod()).isEqualTo("GET");
            assertThat(endpoint.getPath()).isEqualTo("/system/user/export");
            assertThat(endpoint.getSummary()).isEqualTo("导出用户");
        });
    }

    static class DemoController {

        @GetMapping("/system/user/export")
        @PreAuthorize("hasRole('super_admin') or hasAuthority('system:user:export')")
        @Operation(summary = "导出用户")
        public void export() {
        }
    }
}
