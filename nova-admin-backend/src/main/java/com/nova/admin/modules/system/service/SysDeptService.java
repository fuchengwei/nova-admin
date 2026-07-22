package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.nova.admin.modules.system.dto.DeptCreateRequest;
import com.nova.admin.modules.system.dto.DeptTreeDTO;
import com.nova.admin.modules.system.dto.DeptUpdateRequest;
import com.nova.admin.modules.system.entity.SysDept;

import java.util.List;

/**
 * 部门 Service
 */
public interface SysDeptService extends IService<SysDept> {

    /**
     * 获取部门树
     */
    List<DeptTreeDTO> getDeptTree();

    /**
     * 创建部门
     *
     * @param req 创建请求
     * @return 新部门ID
     */
    Long createDept(DeptCreateRequest req);

    /**
     * 更新部门
     *
     * @param req 更新请求
     */
    void updateDept(DeptUpdateRequest req);

    /**
     * 删除部门（检查是否有子部门和关联用户）
     *
     * @param id 部门ID
     */
    void deleteDept(Long id);

    /**
     * 排除某节点的部门树（编辑时用，防止将父节点设为自己或自己的子节点）
     *
     * @param excludeId 排除的节点ID
     * @return 部门树
     */
    List<DeptTreeDTO> getDeptTreeExclude(Long excludeId);

    /**
     * 返回指定部门及其所有下级部门的 ID 列表（含自身）。
     * 用于数据权限“本部门及下级”范围过滤。
     *
     * @param deptId 部门ID
     * @return 包含自身及所有后代部门的 ID 列表
     */
    List<Long> findSelfAndDescendantIds(Long deptId);
}
