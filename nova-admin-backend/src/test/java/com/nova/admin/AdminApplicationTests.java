package com.nova.admin;

import com.nova.admin.modules.job.service.impl.JobServiceImpl;
import com.nova.admin.modules.system.permission.ApiPermissionScanner;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * 上下文加载冒烟测试
 */
@SpringBootTest
@ActiveProfiles("test")
class AdminApplicationTests {

    @MockitoBean
    private JobServiceImpl jobService;

    @Autowired
    private ApiPermissionScanner apiPermissionScanner;

    @Test
    void contextLoads() {
        // 仅用于验证 Spring 上下文能正常加载
    }

    @Test
    void apiPermissionScanner_resolvesMvcHandlerMapping() {
        assertThatCode(() -> apiPermissionScanner.scan()).doesNotThrowAnyException();
    }
}
