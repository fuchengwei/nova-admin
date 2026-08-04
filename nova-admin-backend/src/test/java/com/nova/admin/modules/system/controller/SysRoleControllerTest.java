package com.nova.admin.modules.system.controller;

import com.nova.admin.modules.system.dto.RoleUpdateRequest;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class SysRoleControllerTest {

    @Test
    void updateRole_allowsSuperAdminOrExplicitPermission() throws NoSuchMethodException {
        Method method = SysRoleController.class.getMethod("updateRole", RoleUpdateRequest.class);

        assertThat(method.getAnnotation(PreAuthorize.class).value())
                .isEqualTo("hasRole('super_admin') or hasAuthority('system:role:edit')");
    }
}
