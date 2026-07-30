package com.nova.admin.modules.system.entity;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

class LogEntitySerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void serialize_whenLogIdsExceedJavaScriptSafeInteger_writesStringIds() throws Exception {
        long id = 2081630969835970600L;
        SysOperationLog operationLog = new SysOperationLog();
        operationLog.setId(id);
        SysLoginLog loginLog = new SysLoginLog();
        loginLog.setId(id);

        assertThat(objectMapper.writeValueAsString(operationLog)).contains("\"id\":\"2081630969835970600\"");
        assertThat(objectMapper.writeValueAsString(loginLog)).contains("\"id\":\"2081630969835970600\"");
    }
}
