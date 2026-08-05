package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.ApiPermissionEndpointDTO;
import com.nova.admin.modules.system.dto.ApiPermissionDTO;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.system.entity.SysApiPermission;
import com.nova.admin.modules.system.entity.SysRole;
import com.nova.admin.modules.system.entity.SysRoleApiPermission;
import com.nova.admin.modules.system.entity.SysUserApiPermission;
import com.nova.admin.modules.system.mapper.SysApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysRoleApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    private SysUserMapper userMapper;

    @Mock
    private SysUserApiPermissionMapper userApiPermissionMapper;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ApiPermissionServiceImpl service;

    @Test
    void getApiPermissions_classifiesRegisteredAndDiscovered() {
        SysApiPermission registered = apiPermission(11L, "system:user:list", "用户列表");
        given(apiPermissionMapper.selectList(null)).willReturn(List.of(registered));
        given(roleApiPermissionMapper.selectList(null)).willReturn(List.of());
        given(userApiPermissionMapper.selectList(null)).willReturn(List.of());
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
    void updatePermissionAccess_combinesPublicRoleAndUserGrantsAndRefreshesAffectedUsers() {
        SysApiPermission permission = apiPermission(11L, "system:user:export", "导出用户");
        permission.setPublicAccess(0);
        SysRole role = new SysRole();
        role.setId(20L);
        role.setStatus(1);
        SysRoleApiPermission existingRelation = new SysRoleApiPermission();
        existingRelation.setRoleId(19L);
        existingRelation.setApiPermissionId(11L);
        SysUserApiPermission existingUserRelation = new SysUserApiPermission();
        existingUserRelation.setUserId(30L);
        existingUserRelation.setApiPermissionId(11L);

        given(apiPermissionMapper.selectOne(any())).willReturn(permission);
        given(roleMapper.selectList(any())).willReturn(List.of(role));
        given(roleApiPermissionMapper.selectList(any())).willReturn(List.of(existingRelation));
        given(userApiPermissionMapper.selectList(any())).willReturn(List.of(existingUserRelation));
        given(userMapper.selectEnabledUserIdsByIds(List.of(31L))).willReturn(List.of(31L));
        given(userMapper.selectEnabledUserIdsByRoleIds(any())).willReturn(List.of(32L));
        given(userMapper.selectEnabledUserIds()).willReturn(List.of(30L, 31L, 32L));

        service.updatePermissionAccess("system:user:export", true, List.of(20L), List.of(31L));

        verify(roleApiPermissionMapper).delete(any());
        verify(roleApiPermissionMapper).insert(any(SysRoleApiPermission.class));
        verify(userApiPermissionMapper).delete(any());
        verify(userApiPermissionMapper).insert(any(SysUserApiPermission.class));
        verify(apiPermissionMapper).updateById(permission);
        verify(eventPublisher).publishEvent(any(Object.class));
    }

    @Test
    void updatePermissionAccess_whenUserIsDisabled_rejectsTheBinding() {
        SysApiPermission permission = apiPermission(11L, "system:user:export", "导出用户");
        given(apiPermissionMapper.selectOne(any())).willReturn(permission);
        given(userMapper.selectEnabledUserIdsByIds(List.of(31L))).willReturn(List.of());

        assertThatThrownBy(() -> service.updatePermissionAccess(
                "system:user:export", false, List.of(), List.of(31L)))
                .isInstanceOf(BizException.class);
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
