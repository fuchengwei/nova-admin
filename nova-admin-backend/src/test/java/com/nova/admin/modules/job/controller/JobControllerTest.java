package com.nova.admin.modules.job.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class JobControllerTest {

    @Test
    void logPage_allowsJobListPermission() throws NoSuchMethodException {
        Method method = JobController.class.getMethod(
                "logPage", com.nova.admin.modules.job.dto.JobLogPageQuery.class);

        assertThat(method.getAnnotation(PreAuthorize.class).value())
                .isEqualTo("hasRole('super_admin') or hasAuthority('monitor:job:list')");
    }
}
