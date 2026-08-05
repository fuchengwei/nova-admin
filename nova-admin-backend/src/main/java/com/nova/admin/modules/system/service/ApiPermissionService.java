package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.ApiPermissionDTO;

import java.util.List;

/** 接口权限发现与同步服务。 */
public interface ApiPermissionService {

    List<ApiPermissionDTO> getApiPermissions();

    int syncApiPermissions(List<String> permissions);

    /** 更新接口权限关联的角色。 */
    void updatePermissionRoles(String permission, List<Long> roleIds);
}
