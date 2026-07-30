package com.nova.admin.modules.system.controller;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class SysUserControllerTest {

    @Test
    void deleteUser_allowsSuperAdminOrExplicitPermission() throws NoSuchMethodException {
        Method method = SysUserController.class.getMethod("deleteUser", Long.class);

        assertThat(method.getAnnotation(PreAuthorize.class).value())
                .isEqualTo("hasRole('super_admin') or hasAuthority('system:user:remove')");
    }
}
