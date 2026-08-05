package com.nova.admin.modules.system.controller;

import com.nova.admin.modules.system.dto.ApiPermissionSyncRequest;
import com.nova.admin.modules.system.dto.ApiPermissionRoleBindingRequest;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;

class SysMenuControllerTest {

    @Test
    void apiPermissionDiscovery_requiresMenuListPermission() throws NoSuchMethodException {
        Method method = SysMenuController.class.getMethod("getApiPermissions");

        assertThat(method.getAnnotation(PreAuthorize.class).value())
                .isEqualTo("hasAuthority('system:menu:list')");
    }

    @Test
    void apiPermissionSync_requiresMenuEditPermission() throws NoSuchMethodException {
        Method method = SysMenuController.class.getMethod("syncApiPermissions", ApiPermissionSyncRequest.class);

        assertThat(method.getAnnotation(PreAuthorize.class).value())
                .isEqualTo("hasRole('super_admin') or hasAuthority('system:menu:edit')");
    }

    @Test
    void apiPermissionRoleBinding_requiresMenuEditPermission() throws NoSuchMethodException {
        Method method = SysMenuController.class.getMethod(
                "updateApiPermissionRoles", ApiPermissionRoleBindingRequest.class);

        assertThat(method.getAnnotation(PreAuthorize.class).value())
                .isEqualTo("hasRole('super_admin') or hasAuthority('system:menu:edit')");
    }
}
