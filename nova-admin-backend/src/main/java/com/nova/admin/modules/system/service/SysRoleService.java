package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.system.dto.RoleCreateRequest;
import com.nova.admin.modules.system.dto.RoleDetailDTO;
import com.nova.admin.modules.system.dto.RolePageQuery;
import com.nova.admin.modules.system.dto.RoleUpdateRequest;
import com.nova.admin.modules.system.entity.SysRole;

import java.util.List;

/**
 * 角色 Service
 */
public interface SysRoleService extends IService<SysRole> {

    /**
     * 角色分页列表
     */
    PageResult<SysRole> getRolePage(RolePageQuery query);

    /**
     * 获取所有角色（简单列表，用于下拉选择）
     */
    List<SysRole> getAllRoles();

    /**
     * 创建角色
     */
    Long createRole(RoleCreateRequest req);

    /**
     * 更新角色
     */
    void updateRole(RoleUpdateRequest req);

    /**
     * 删除角色（检查是否有关联用户）
     */
    void deleteRole(Long id);

    /**
     * 角色详情（含菜单ID列表）
     */
    RoleDetailDTO getRoleDetail(Long id);
}