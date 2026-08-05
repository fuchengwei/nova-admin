package com.nova.admin.modules.system.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationPublishControllerTest {

    @Test
    void publish_requiresNotificationPublishPermission() throws NoSuchMethodException {
        Method method = NotificationController.class.getMethod(
                "publish", com.nova.admin.modules.system.dto.NotificationPublishRequest.class);

        assertThat(method.getAnnotation(PreAuthorize.class).value())
                .isEqualTo("hasRole('super_admin') or hasAuthority('system:notification:publish')");
    }
}
