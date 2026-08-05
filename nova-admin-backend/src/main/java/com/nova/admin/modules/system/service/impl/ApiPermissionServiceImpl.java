package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.auth.event.AuthorizationChangedEvent;
import com.nova.admin.modules.system.dto.ApiPermissionDTO;
import com.nova.admin.modules.system.dto.ApiPermissionEndpointDTO;
import com.nova.admin.modules.system.dto.ApiPermissionUserOptionDTO;
import com.nova.admin.modules.system.entity.SysApiPermission;
import com.nova.admin.modules.system.entity.SysRole;
import com.nova.admin.modules.system.entity.SysRoleApiPermission;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.entity.SysUserApiPermission;
import com.nova.admin.modules.system.mapper.SysApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysRoleApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserApiPermissionMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.permission.ApiPermissionScanner;
import com.nova.admin.modules.system.service.ApiPermissionService;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/** 独立接口权限发现、注册与授权范围配置服务。 */
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
    private final SysUserMapper userMapper;
    private final SysUserApiPermissionMapper userApiPermissionMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public List<ApiPermissionDTO> getApiPermissions() {
        return buildPermissions(apiPermissionScanner.scan(), apiPermissionMapper.selectList(null));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApiPermissionUserOptionDTO> getAssignableUsers() {
        return userMapper.selectList(new LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getStatus, 1)
                        .orderByAsc(SysUser::getAccount))
                .stream()
                .map(user -> new ApiPermissionUserOptionDTO(user.getId(), userLabel(user)))
                .toList();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updatePermissionAccess(String permission, boolean publicAccess, List<Long> roleIds,
                                       List<Long> userIds) {
        SysApiPermission apiPermission = apiPermissionMapper.selectOne(new LambdaQueryWrapper<SysApiPermission>()
                .eq(SysApiPermission::getPermission, permission)
                .eq(SysApiPermission::getStatus, 1));
        if (apiPermission == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "接口权限尚未注册");
        }

        List<Long> normalizedRoleIds = normalizeIds(roleIds);
        List<Long> normalizedUserIds = normalizeIds(userIds);
        List<SysRole> roles = normalizedRoleIds.isEmpty()
                ? List.of()
                : roleMapper.selectList(new LambdaQueryWrapper<SysRole>()
                        .in(SysRole::getId, normalizedRoleIds)
                        .eq(SysRole::getStatus, 1));
        if (roles.size() != normalizedRoleIds.size()) {
            throw new BizException(ResultCode.BAD_REQUEST, "只能分配给启用角色");
        }
        List<Long> enabledUserIds = normalizedUserIds.isEmpty()
                ? List.of()
                : userMapper.selectEnabledUserIdsByIds(normalizedUserIds);
        if (enabledUserIds.size() != normalizedUserIds.size()) {
            throw new BizException(ResultCode.BAD_REQUEST, "只能分配给启用用户");
        }

        List<SysRoleApiPermission> existingRelations = roleApiPermissionMapper
                .selectList(new LambdaQueryWrapper<SysRoleApiPermission>()
                        .eq(SysRoleApiPermission::getApiPermissionId, apiPermission.getId()));
        Set<Long> affectedRoleIds = existingRelations.stream()
                .map(SysRoleApiPermission::getRoleId)
                .collect(Collectors.toSet());
        affectedRoleIds.addAll(normalizedRoleIds);

        List<SysUserApiPermission> existingUserRelations = userApiPermissionMapper
                .selectList(new LambdaQueryWrapper<SysUserApiPermission>()
                        .eq(SysUserApiPermission::getApiPermissionId, apiPermission.getId()));
        Set<Long> affectedUserIds = new HashSet<>(normalizedUserIds);
        existingUserRelations.stream().map(SysUserApiPermission::getUserId).forEach(affectedUserIds::add);

        roleApiPermissionMapper.delete(new LambdaQueryWrapper<SysRoleApiPermission>()
                .eq(SysRoleApiPermission::getApiPermissionId, apiPermission.getId()));
        userApiPermissionMapper.delete(new LambdaQueryWrapper<SysUserApiPermission>()
                .eq(SysUserApiPermission::getApiPermissionId, apiPermission.getId()));
        for (Long roleId : normalizedRoleIds) {
            SysRoleApiPermission relation = new SysRoleApiPermission();
            relation.setRoleId(roleId);
            relation.setApiPermissionId(apiPermission.getId());
            roleApiPermissionMapper.insert(relation);
        }
        for (Long userId : normalizedUserIds) {
            SysUserApiPermission relation = new SysUserApiPermission();
            relation.setUserId(userId);
            relation.setApiPermissionId(apiPermission.getId());
            userApiPermissionMapper.insert(relation);
        }

        boolean publicAccessChanged = !Objects.equals(apiPermission.getPublicAccess(), publicAccess ? 1 : 0);
        apiPermission.setPublicAccess(publicAccess ? 1 : 0);
        apiPermissionMapper.updateById(apiPermission);

        if (!affectedRoleIds.isEmpty()) {
            affectedUserIds.addAll(userMapper.selectEnabledUserIdsByRoleIds(affectedRoleIds));
        }
        if (publicAccessChanged) {
            affectedUserIds.addAll(userMapper.selectEnabledUserIds());
        }
        publishPermissionRefresh(affectedUserIds);
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
        List<SysUserApiPermission> userRelations = userApiPermissionMapper.selectList(null);
        if (userRelations == null) {
            userRelations = List.of();
        }
        Map<Long, List<Long>> userIdsByPermission = userRelations.stream()
                .collect(Collectors.groupingBy(SysUserApiPermission::getApiPermissionId,
                        Collectors.mapping(SysUserApiPermission::getUserId, Collectors.toList())));
        return discovered.entrySet().stream()
                .map(entry -> toPermission(entry.getKey(), entry.getValue(), registered, roleIdsByPermission,
                        userIdsByPermission))
                .sorted(Comparator.comparing(ApiPermissionDTO::getPermission))
                .toList();
    }

    private ApiPermissionDTO toPermission(String permission, List<ApiPermissionEndpointDTO> endpoints,
                                          Map<String, SysApiPermission> registered,
                                          Map<Long, List<Long>> roleIdsByPermission,
                                          Map<Long, List<Long>> userIdsByPermission) {
        SysApiPermission registeredPermission = registered.get(permission);
        return ApiPermissionDTO.builder()
                .permission(permission)
                .name(endpoints.getFirst().getSummary())
                .endpoints(endpoints)
                .status(registeredPermission == null ? STATUS_SYNCABLE : STATUS_REGISTERED)
                .roleIds(registeredPermission == null
                        ? List.of()
                        : roleIdsByPermission.getOrDefault(registeredPermission.getId(), List.of()))
                .publicAccess(registeredPermission != null
                        && Integer.valueOf(1).equals(registeredPermission.getPublicAccess()))
                .userIds(registeredPermission == null
                        ? List.of()
                        : userIdsByPermission.getOrDefault(registeredPermission.getId(), List.of()))
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
        publishRolePermissionRefresh(Set.of(superAdmin.getId()));
    }

    private List<Long> normalizeIds(List<Long> ids) {
        return ids == null ? List.of() : ids.stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private String userLabel(SysUser user) {
        return StringUtils.hasText(user.getNickname())
                ? user.getNickname() + " (" + user.getAccount() + ")"
                : user.getAccount();
    }

    private void publishRolePermissionRefresh(Set<Long> roleIds) {
        if (roleIds.isEmpty()) {
            return;
        }
        publishPermissionRefresh(new HashSet<>(userMapper.selectEnabledUserIdsByRoleIds(roleIds)));
    }

    private void publishPermissionRefresh(Set<Long> userIds) {
        if (!userIds.isEmpty()) {
            eventPublisher.publishEvent(AuthorizationChangedEvent.permissionsOf(userIds));
        }
    }
}
