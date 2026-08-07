package com.nova.admin.modules.auth;

import com.nova.admin.common.api.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 公共接口 - 健康检查
 */
@Tag(name = "公共 - 健康检查")
@RestController
@RequestMapping("/public")
public class PingController {

    @Operation(summary = "Ping - 检查服务在线状态")
    @GetMapping("/ping")
    public R<Map<String, Object>> ping() {
        return R.ok(Map.of(
                "app", "nova-admin",
                "version", "1.0.0-SNAPSHOT",
                "ts", LocalDateTime.now().toString()
        ));
    }
}
