package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.ApiPermissionDTO;
import com.nova.admin.modules.system.dto.ApiPermissionUserOptionDTO;

import java.util.List;

/** 接口权限发现与同步服务。 */
public interface ApiPermissionService {

    List<ApiPermissionDTO> getApiPermissions();

    int syncApiPermissions(List<String> permissions);

    List<ApiPermissionUserOptionDTO> getAssignableUsers();

    /** 更新接口权限公开、角色和直接用户授权。 */
    void updatePermissionAccess(String permission, boolean publicAccess, List<Long> roleIds, List<Long> userIds);
}
