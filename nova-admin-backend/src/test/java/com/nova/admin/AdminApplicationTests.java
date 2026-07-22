package com.nova.admin;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * 上下文加载冒烟测试
 */
@SpringBootTest
@ActiveProfiles("test")
class AdminApplicationTests {

    @Test
    void contextLoads() {
        // 仅用于验证 Spring 上下文能正常加载
    }
}
