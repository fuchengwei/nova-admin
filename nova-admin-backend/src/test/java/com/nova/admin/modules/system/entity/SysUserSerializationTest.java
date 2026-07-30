package com.nova.admin.modules.system.entity;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;

class SysUserSerializationTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void serialize_whenUserIdExceedsJavaScriptSafeInteger_writesStringId() throws Exception {
        SysUser user = new SysUser();
        user.setId(2082674922291187700L);

        assertThat(objectMapper.writeValueAsString(user))
                .contains("\"id\":\"2082674922291187700\"");
    }
}
