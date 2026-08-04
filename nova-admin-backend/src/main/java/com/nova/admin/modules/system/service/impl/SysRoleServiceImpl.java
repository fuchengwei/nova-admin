package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.auth.event.AuthorizationChangedEvent;
import com.nova.admin.modules.system.dto.RoleCreateRequest;
import com.nova.admin.modules.system.dto.RoleDetailDTO;
import com.nova.admin.modules.system.dto.RolePageQuery;
import com.nova.admin.modules.system.dto.RoleUpdateRequest;
import com.nova.admin.modules.system.entity.SysRole;
import com.nova.admin.modules.system.entity.SysRoleDept;
import com.nova.admin.modules.system.entity.SysRoleMenu;
import com.nova.admin.modules.system.entity.SysUserRole;
import com.nova.admin.modules.system.entity.SysDept;
import com.nova.admin.modules.system.mapper.SysDeptMapper;
import com.nova.admin.modules.system.mapper.SysRoleDeptMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysRoleMenuMapper;
import com.nova.admin.modules.system.mapper.SysUserRoleMapper;
import com.nova.admin.modules.system.service.SysRoleService;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 角色 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysRoleServiceImpl extends ServiceImpl<SysRoleMapper, SysRole> implements SysRoleService {

    private final SysRoleMenuMapper roleMenuMapper;
    private final SysRoleDeptMapper roleDeptMapper;
    private final SysDeptMapper deptMapper;
    private final SysUserRoleMapper userRoleMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public PageResult<SysRole> getRolePage(RolePageQuery query) {
        Page<SysRole> page = new Page<>(query.getCurrent(), query.getSize());

        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<SysRole>()
                .like(query.getName() != null, SysRole::getName, query.getName())
                .like(query.getCode() != null, SysRole::getCode, query.getCode())
                .eq(query.getStatus() != null, SysRole::getStatus, query.getStatus())
                .orderByAsc(SysRole::getSort);

        Page<SysRole> result = page(page, wrapper);
        return PageResult.of(result);
    }

    @Override
    public List<SysRole> getAllRoles() {
        return list(new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getStatus, 1)
                .orderByAsc(SysRole::getSort));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createRole(RoleCreateRequest req) {
        // 检查角色编码唯一
        checkRoleCodeUnique(null, req.getCode());

        SysRole role = new SysRole();
        populateRoleFields(role, req.getName(), req.getCode(), req.getDescription(),
                req.getDataScope(), req.getSort(), req.getStatus());

        Long userId = SecurityUtils.requireUserId();
        role.setCreateBy(userId);
        role.setUpdateBy(userId);

        save(role);

        // 保存角色菜单关联
        saveRoleMenus(role.getId(), req.getMenuIds());
        saveRoleDepts(role.getId(), req.getDataScope(), req.getDeptIds());

        log.info("创建角色成功，id={}, code={}, operator={}", role.getId(), role.getCode(), userId);
        return role.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateRole(RoleUpdateRequest req) {
        // 检查存在
        SysRole existing = getById(req.getId());
        if (existing == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "角色不存在");
        }

        // 检查角色编码唯一（排除自身）
        checkRoleCodeUnique(req.getId(), req.getCode());

        SysRole role = new SysRole();
        role.setId(req.getId());
        populateRoleFields(role, req.getName(), req.getCode(), req.getDescription(),
                req.getDataScope(), req.getSort(), req.getStatus());

        Long operatorId = SecurityUtils.requireUserId();
        role.setUpdateBy(operatorId);

        updateById(role);

        // 更新角色菜单关联（先删后插）
        roleMenuMapper.delete(new LambdaQueryWrapper<SysRoleMenu>()
                .eq(SysRoleMenu::getRoleId, req.getId()));
        saveRoleMenus(req.getId(), req.getMenuIds());
        saveRoleDepts(req.getId(), req.getDataScope(), req.getDeptIds());

        publishRoleUserInvalidation(req.getId());

        log.info("更新角色成功，id={}, operator={}", req.getId(), operatorId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteRole(Long id) {
        // 检查存在
        SysRole existing = getById(id);
        if (existing == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "角色不存在");
        }

        // 检查是否有关联用户
        long userCount = userRoleMapper.selectCount(new LambdaQueryWrapper<SysUserRole>()
                .eq(SysUserRole::getRoleId, id));
        if (userCount > 0) {
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "该角色下存在关联用户，无法删除");
        }

        // 逻辑删除
        removeById(id);

        // 删除角色菜单关联
        roleMenuMapper.delete(new LambdaQueryWrapper<SysRoleMenu>()
                .eq(SysRoleMenu::getRoleId, id));

        // 删除角色部门关联
        roleDeptMapper.delete(new LambdaQueryWrapper<SysRoleDept>()
                .eq(SysRoleDept::getRoleId, id));

        Long operatorId = SecurityUtils.requireUserId();
        log.info("删除角色成功，id={}, operator={}", id, operatorId);
    }

    @Override
    public RoleDetailDTO getRoleDetail(Long id) {
        SysRole role = getById(id);
        if (role == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "角色不存在");
        }

        // 查询角色关联的菜单ID列表
        List<SysRoleMenu> roleMenus = roleMenuMapper.selectList(new LambdaQueryWrapper<SysRoleMenu>()
                .eq(SysRoleMenu::getRoleId, id));
        List<Long> menuIds = roleMenus.stream()
                .map(SysRoleMenu::getMenuId)
                .toList();

        List<Long> deptIds = roleDeptMapper.selectList(new LambdaQueryWrapper<SysRoleDept>()
                        .eq(SysRoleDept::getRoleId, id))
                .stream()
                .map(SysRoleDept::getDeptId)
                .toList();

        return RoleDetailDTO.builder()
                .id(role.getId())
                .name(role.getName())
                .code(role.getCode())
                .description(role.getDescription())
                .dataScope(role.getDataScope())
                .sort(role.getSort())
                .status(role.getStatus())
                .createTime(role.getCreateTime())
                .updateTime(role.getUpdateTime())
                .menuIds(menuIds)
                .deptIds(deptIds)
                .build();
    }

    // ==================== 私有方法 ====================

    /**
     * 填充角色字段
     */
    private void populateRoleFields(SysRole role, String name, String code, String description,
                                    Integer dataScope, Integer sort, Integer status) {
        role.setName(name);
        role.setCode(code);
        role.setDescription(description);
        role.setDataScope(dataScope);
        role.setSort(sort != null ? sort : 0);
        role.setStatus(status);
    }

    /**
     * 检查角色编码唯一
     */
    private void checkRoleCodeUnique(Long excludeId, String code) {
        LambdaQueryWrapper<SysRole> wrapper = new LambdaQueryWrapper<SysRole>()
                .eq(SysRole::getCode, code);
        if (excludeId != null) {
            wrapper.ne(SysRole::getId, excludeId);
        }
        long count = count(wrapper);
        if (count > 0) {
            throw new BizException(ResultCode.DATA_EXISTS, "角色编码已存在");
        }
    }

    /**
     * 保存角色菜单关联
     */
    private void saveRoleMenus(Long roleId, List<Long> menuIds) {
        if (menuIds != null && !menuIds.isEmpty()) {
            for (Long menuId : menuIds) {
                SysRoleMenu roleMenu = new SysRoleMenu();
                roleMenu.setRoleId(roleId);
                roleMenu.setMenuId(menuId);
                roleMenuMapper.insert(roleMenu);
            }
        }
    }

    /** 保存角色自定义部门范围，并校验部门均为启用状态。 */
    private void saveRoleDepts(Long roleId, Integer dataScope, List<Long> deptIds) {
        roleDeptMapper.delete(new LambdaQueryWrapper<SysRoleDept>()
                .eq(SysRoleDept::getRoleId, roleId));
        if (!Integer.valueOf(6).equals(dataScope)) {
            return;
        }
        List<Long> normalizedIds = deptIds == null
                ? List.of()
                : deptIds.stream().filter(java.util.Objects::nonNull).distinct().toList();
        if (normalizedIds.isEmpty()) {
            throw new BizException(ResultCode.BAD_REQUEST, "自定义部门范围至少选择一个部门");
        }
        long validCount = deptMapper.selectCount(new LambdaQueryWrapper<SysDept>()
                .in(SysDept::getId, normalizedIds)
                .eq(SysDept::getStatus, 1));
        if (validCount != normalizedIds.size()) {
            throw new BizException(ResultCode.BAD_REQUEST, "自定义部门包含不存在或已停用的部门");
        }
        for (Long deptId : normalizedIds) {
            SysRoleDept roleDept = new SysRoleDept();
            roleDept.setRoleId(roleId);
            roleDept.setDeptId(deptId);
            roleDeptMapper.insert(roleDept);
        }
    }

    private void publishRoleUserInvalidation(Long roleId) {
        Set<Long> userIds = userRoleMapper.selectList(new LambdaQueryWrapper<SysUserRole>()
                        .eq(SysUserRole::getRoleId, roleId))
                .stream()
                .map(SysUserRole::getUserId)
                .collect(Collectors.toSet());
        if (!userIds.isEmpty()) {
            eventPublisher.publishEvent(AuthorizationChangedEvent.permissionsOf(userIds));
        }
    }
}
