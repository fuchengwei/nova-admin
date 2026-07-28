package com.nova.admin.common.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Arrays;
import java.util.Iterator;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 将控制器参数转换为可安全留存的审计数据。
 */
@Component
public class AuditArgumentSanitizer {

    private static final String MASKED_VALUE = "***";
    private static final Set<String> SENSITIVE_FIELDS = Set.of(
            "password", "oldpassword", "newpassword", "confirmpassword",
            "captchacode", "captchakey", "token", "accesstoken", "refreshtoken",
            "authorization", "secret", "clientsecret");

    private final ObjectMapper objectMapper;

    public AuditArgumentSanitizer() {
        this(new ObjectMapper());
    }

    public AuditArgumentSanitizer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public String sanitizeArgs(Object[] args) {
        return Arrays.stream(args)
                .map(this::sanitizeArg)
                .collect(Collectors.joining(",", "[", "]"));
    }

    private String sanitizeArg(Object arg) {
        if (arg == null) {
            return "null";
        }
        if (arg instanceof MultipartFile file) {
            return toJson(Map.of("fileName", file.getOriginalFilename(), "size", file.getSize()));
        }
        if (arg instanceof ServletRequest || arg instanceof ServletResponse || arg instanceof InputStream || arg instanceof byte[]) {
            return toJson("[NON_AUDITABLE_PAYLOAD]");
        }
        try {
            JsonNode source = objectMapper.valueToTree(arg);
            return toJson(maskSensitiveFields(source.deepCopy()));
        } catch (IllegalArgumentException e) {
            return toJson("[UNSERIALIZABLE_ARGUMENT]");
        }
    }

    private JsonNode maskSensitiveFields(JsonNode node) {
        if (node instanceof ObjectNode objectNode) {
            Iterator<Map.Entry<String, JsonNode>> fields = objectNode.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> field = fields.next();
                if (isSensitiveField(field.getKey())) {
                    field.setValue(objectNode.textNode(MASKED_VALUE));
                } else {
                    field.setValue(maskSensitiveFields(field.getValue()));
                }
            }
            return objectNode;
        }
        if (node instanceof ArrayNode arrayNode) {
            for (int i = 0; i < arrayNode.size(); i++) {
                arrayNode.set(i, maskSensitiveFields(arrayNode.get(i)));
            }
        }
        return node;
    }

    private boolean isSensitiveField(String fieldName) {
        String normalized = fieldName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase(Locale.ROOT);
        return SENSITIVE_FIELDS.contains(normalized);
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "\"[UNSERIALIZABLE_ARGUMENT]\"";
        }
    }
}
