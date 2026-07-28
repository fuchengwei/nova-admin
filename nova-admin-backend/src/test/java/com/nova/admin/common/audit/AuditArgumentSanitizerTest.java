package com.nova.admin.common.audit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class AuditArgumentSanitizerTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AuditArgumentSanitizer sanitizer = new AuditArgumentSanitizer(objectMapper);

    @Test
    void sanitizeArgs_masksSensitiveFieldsWithoutMaskingSafePasswordSettings() throws Exception {
        String sanitized = sanitizer.sanitizeArgs(new Object[]{Map.of(
                "account", "admin",
                "password", "secret-password",
                "passwordMinLength", 12,
                "nested", Map.of("refreshToken", "refresh-token", "captchaCode", "A1B2"))});

        JsonNode payload = objectMapper.readTree(sanitized).get(0);

        assertThat(payload.get("account").asText()).isEqualTo("admin");
        assertThat(payload.get("password").asText()).isEqualTo("***");
        assertThat(payload.get("passwordMinLength").asInt()).isEqualTo(12);
        assertThat(payload.path("nested").path("refreshToken").asText()).isEqualTo("***");
        assertThat(payload.path("nested").path("captchaCode").asText()).isEqualTo("***");
    }
}
