package com.nova.admin.modules.system.controller;

import com.nova.admin.modules.system.dto.NotificationSummaryDTO;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationControllerTest {

    @Test
    void controller_exposesDocumentedAuthenticatedEndpoints() throws NoSuchMethodException {
        assertThat(NotificationController.class.getAnnotation(Tag.class).name())
                .isEqualTo("站内消息");
        assertThat(NotificationController.class.getMethod("getSummary")
                .getAnnotation(Operation.class).summary()).contains("摘要");

        Method markRead = NotificationController.class.getMethod("markRead", Long.class);
        assertThat(markRead.getAnnotation(PutMapping.class).value())
                .containsExactly("/{id}/read");
        assertThat(markRead.getParameters()[0].getAnnotation(Parameter.class)).isNotNull();

        Method markAllRead = NotificationController.class.getMethod("markAllRead");
        assertThat(markAllRead.getAnnotation(PutMapping.class).value())
                .containsExactly("/read-all");
        assertThat(NotificationController.class.getMethod("getSummary")
                .getAnnotation(GetMapping.class).value()).containsExactly("/summary");
        assertThat(NotificationController.class.getMethod("getSummary")
                .getReturnType()).isEqualTo(com.nova.admin.common.api.R.class);
        assertThat(NotificationSummaryDTO.class).isNotNull();
    }
}
