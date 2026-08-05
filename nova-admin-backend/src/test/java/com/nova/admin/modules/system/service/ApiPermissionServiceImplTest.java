package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.ApiPermissionEndpointDTO;
import com.nova.admin.modules.system.dto.ApiPermissionDTO;
import com.nova.admin.modules.system.entity.SysApiPermission;
import com.nova.admin.modules.system.entity.SysRole;
import com.nova.admin.modules.system.entity.SysRoleApiPermission;
import com.nova.admin.modules.system.entity.SysUserRole;
import com.nova.admin.modules.system.mapper.SysApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysRoleApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserRoleMapper;
import com.nova.admin.modules.system.permission.ApiPermissionScanner;
import com.nova.admin.modules.system.service.impl.ApiPermissionServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ApiPermissionServiceImplTest {

    @Mock
    private ApiPermissionScanner apiPermissionScanner;

    @Mock
    private SysApiPermissionMapper apiPermissionMapper;

    @Mock
    private SysRoleMapper roleMapper;

    @Mock
    private SysRoleApiPermissionMapper roleApiPermissionMapper;

    @Mock
    private SysUserRoleMapper userRoleMapper;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ApiPermissionServiceImpl service;

    @Test
    void getApiPermissions_classifiesRegisteredAndDiscovered() {
        SysApiPermission registered = apiPermission(11L, "system:user:list", "用户列表");
        given(apiPermissionMapper.selectList(null)).willReturn(List.of(registered));
        given(roleApiPermissionMapper.selectList(null)).willReturn(List.of());
        given(apiPermissionScanner.scan()).willReturn(Map.of(
                "system:user:list", List.of(endpoint("GET", "/system/user/page")),
                "system:user:reset-pwd", List.of(endpoint("POST", "/system/user/reset-pwd")),
                "external:report:read", List.of(endpoint("GET", "/external/report"))));

        List<ApiPermissionDTO> result = service.getApiPermissions();

        assertThat(result).extracting(ApiPermissionDTO::getStatus)
                .containsExactlyInAnyOrder("REGISTERED", "SYNCABLE", "SYNCABLE");
        assertThat(result.stream().filter(item -> item.getPermission().equals("system:user:list"))
                .findFirst().orElseThrow().getRoleIds()).isEmpty();
    }

    @Test
    void updatePermissionRoles_replacesBindingsAndRefreshesAffectedUsers() {
        SysApiPermission permission = apiPermission(11L, "system:user:export", "导出用户");
        SysRole role = new SysRole();
        role.setId(20L);
        role.setStatus(1);
        SysRoleApiPermission existingRelation = new SysRoleApiPermission();
        existingRelation.setRoleId(19L);
        existingRelation.setApiPermissionId(11L);
        SysUserRole userRole = new SysUserRole();
        userRole.setUserId(30L);
        userRole.setRoleId(20L);

        given(apiPermissionMapper.selectOne(any())).willReturn(permission);
        given(roleMapper.selectList(any())).willReturn(List.of(role));
        given(roleApiPermissionMapper.selectList(any())).willReturn(List.of(existingRelation));
        given(userRoleMapper.selectList(any())).willReturn(List.of(userRole));

        service.updatePermissionRoles("system:user:export", List.of(20L));

        verify(roleApiPermissionMapper).delete(any());
        verify(roleApiPermissionMapper).insert(any(SysRoleApiPermission.class));
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    private SysApiPermission apiPermission(Long id, String permission, String name) {
        SysApiPermission item = new SysApiPermission();
        item.setId(id);
        item.setPermission(permission);
        item.setName(name);
        item.setStatus(1);
        return item;
    }

    private ApiPermissionEndpointDTO endpoint(String method, String path) {
        return ApiPermissionEndpointDTO.builder().method(method).path(path).summary("接口").build();
    }
}
