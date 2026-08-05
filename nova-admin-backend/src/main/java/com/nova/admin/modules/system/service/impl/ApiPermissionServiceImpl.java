package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.auth.event.AuthorizationChangedEvent;
import com.nova.admin.modules.system.dto.ApiPermissionDTO;
import com.nova.admin.modules.system.dto.ApiPermissionEndpointDTO;
import com.nova.admin.modules.system.entity.SysApiPermission;
import com.nova.admin.modules.system.entity.SysRole;
import com.nova.admin.modules.system.entity.SysRoleApiPermission;
import com.nova.admin.modules.system.entity.SysUserRole;
import com.nova.admin.modules.system.mapper.SysApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysRoleApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserRoleMapper;
import com.nova.admin.modules.system.permission.ApiPermissionScanner;
import com.nova.admin.modules.system.service.ApiPermissionService;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/** 独立接口权限发现、注册与角色分配服务。 */
@Service
@RequiredArgsConstructor
public class ApiPermissionServiceImpl implements ApiPermissionService {

    public static final String STATUS_REGISTERED = "REGISTERED";
    public static final String STATUS_SYNCABLE = "SYNCABLE";
    private static final String SUPER_ADMIN_ROLE = "super_admin";

    private final ApiPermissionScanner apiPermissionScanner;
    private final SysApiPermissionMapper apiPermissionMapper;
    private final SysRoleMapper roleMapper;
    private final SysRoleApiPermissionMapper roleApiPermissionMapper;
    private final SysUserRoleMapper userRoleMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public List<ApiPermissionDTO> getApiPermissions() {
        return buildPermissions(apiPermissionScanner.scan(), apiPermissionMapper.selectList(null));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePermissionRoles(String permission, List<Long> roleIds) {
        SysApiPermission apiPermission = apiPermissionMapper.selectOne(new LambdaQueryWrapper<SysApiPermission>()
                .eq(SysApiPermission::getPermission, permission)
                .eq(SysApiPermission::getStatus, 1));
        if (apiPermission == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "接口权限尚未注册");
        }

        List<Long> normalizedRoleIds = roleIds == null ? List.of() : roleIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<SysRole> roles = normalizedRoleIds.isEmpty()
                ? List.of()
                : roleMapper.selectList(new LambdaQueryWrapper<SysRole>()
                        .in(SysRole::getId, normalizedRoleIds)
                        .eq(SysRole::getStatus, 1));
        if (roles.size() != normalizedRoleIds.size()) {
            throw new BizException(ResultCode.BAD_REQUEST, "只能分配给启用角色");
        }

        List<SysRoleApiPermission> existingRelations = roleApiPermissionMapper
                .selectList(new LambdaQueryWrapper<SysRoleApiPermission>()
                        .eq(SysRoleApiPermission::getApiPermissionId, apiPermission.getId()));
        Set<Long> affectedRoleIds = existingRelations.stream()
                .map(SysRoleApiPermission::getRoleId)
                .collect(Collectors.toSet());
        affectedRoleIds.addAll(normalizedRoleIds);

        roleApiPermissionMapper.delete(new LambdaQueryWrapper<SysRoleApiPermission>()
                .eq(SysRoleApiPermission::getApiPermissionId, apiPermission.getId()));
        for (Long roleId : normalizedRoleIds) {
            SysRoleApiPermission relation = new SysRoleApiPermission();
            relation.setRoleId(roleId);
            relation.setApiPermissionId(apiPermission.getId());
            roleApiPermissionMapper.insert(relation);
        }

        publishPermissionRefresh(affectedRoleIds);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public int syncApiPermissions(List<String> permissions) {
        List<SysApiPermission> registeredPermissions = apiPermissionMapper.selectList(null);
        Map<String, SysApiPermission> registered = registeredPermissions.stream()
                .collect(Collectors.toMap(SysApiPermission::getPermission, item -> item, (first, ignored) -> first));
        Set<String> requested = permissions == null ? Set.of() : permissions.stream()
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.toSet());
        List<ApiPermissionDTO> syncable = apiPermissionScanner.scan().entrySet().stream()
                .filter(entry -> !registered.containsKey(entry.getKey()))
                .filter(entry -> requested.isEmpty() || requested.contains(entry.getKey()))
                .map(entry -> ApiPermissionDTO.builder()
                        .permission(entry.getKey())
                        .name(entry.getValue().getFirst().getSummary())
                        .endpoints(entry.getValue())
                        .build())
                .toList();
        if (syncable.isEmpty()) {
            return 0;
        }

        Long operatorId = SecurityUtils.requireUserId();
        List<SysApiPermission> createdPermissions = new ArrayList<>();
        for (ApiPermissionDTO item : syncable) {
            SysApiPermission apiPermission = new SysApiPermission();
            apiPermission.setPermission(item.getPermission());
            apiPermission.setName(item.getName());
            apiPermission.setStatus(1);
            apiPermission.setCreateBy(operatorId);
            apiPermission.setUpdateBy(operatorId);
            apiPermissionMapper.insert(apiPermission);
            createdPermissions.add(apiPermission);
        }
        grantToSuperAdmin(createdPermissions);
        return createdPermissions.size();
    }

    private List<ApiPermissionDTO> buildPermissions(Map<String, List<ApiPermissionEndpointDTO>> discovered,
                                                     List<SysApiPermission> registeredPermissions) {
        Map<String, SysApiPermission> registered = registeredPermissions.stream()
                .filter(item -> item.getPermission() != null && !item.getPermission().isBlank())
                .collect(Collectors.toMap(SysApiPermission::getPermission, item -> item, (first, ignored) -> first));
        List<SysRoleApiPermission> roleRelations = roleApiPermissionMapper.selectList(null);
        if (roleRelations == null) {
            roleRelations = List.of();
        }
        Map<Long, List<Long>> roleIdsByPermission = roleRelations.stream()
                .collect(Collectors.groupingBy(SysRoleApiPermission::getApiPermissionId,
                        Collectors.mapping(SysRoleApiPermission::getRoleId, Collectors.toList())));
        return discovered.entrySet().stream()
                .map(entry -> toPermission(entry.getKey(), entry.getValue(), registered, roleIdsByPermission))
                .sorted(Comparator.comparing(ApiPermissionDTO::getPermission))
                .toList();
    }

    private ApiPermissionDTO toPermission(String permission, List<ApiPermissionEndpointDTO> endpoints,
                                          Map<String, SysApiPermission> registered,
                                          Map<Long, List<Long>> roleIdsByPermission) {
        SysApiPermission registeredPermission = registered.get(permission);
        return ApiPermissionDTO.builder()
                .permission(permission)
                .name(endpoints.getFirst().getSummary())
                .endpoints(endpoints)
                .status(registeredPermission == null ? STATUS_SYNCABLE : STATUS_REGISTERED)
                .roleIds(registeredPermission == null
                        ? List.of()
                        : roleIdsByPermission.getOrDefault(registeredPermission.getId(), List.of()))
                .build();
    }

    private void grantToSuperAdmin(List<SysApiPermission> createdPermissions) {
        SysRole superAdmin = roleMapper.selectOne(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getCode, SUPER_ADMIN_ROLE)
                .eq(SysRole::getStatus, 1));
        if (superAdmin == null) {
            return;
        }
        for (SysApiPermission apiPermission : createdPermissions) {
            SysRoleApiPermission relation = new SysRoleApiPermission();
            relation.setRoleId(superAdmin.getId());
            relation.setApiPermissionId(apiPermission.getId());
            roleApiPermissionMapper.insert(relation);
        }
        publishPermissionRefresh(Set.of(superAdmin.getId()));
    }

    private void publishPermissionRefresh(Set<Long> roleIds) {
        if (roleIds.isEmpty()) {
            return;
        }
        Set<Long> userIds = userRoleMapper.selectList(new LambdaQueryWrapper<SysUserRole>()
                        .in(SysUserRole::getRoleId, roleIds))
                .stream()
                .map(SysUserRole::getUserId)
                .collect(Collectors.toSet());
        if (!userIds.isEmpty()) {
            eventPublisher.publishEvent(AuthorizationChangedEvent.permissionsOf(userIds));
        }
    }
}
