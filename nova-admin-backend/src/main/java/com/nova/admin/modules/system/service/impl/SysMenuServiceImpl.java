package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.auth.event.AuthorizationChangedEvent;
import com.nova.admin.modules.system.dto.MenuCreateRequest;
import com.nova.admin.modules.system.dto.MenuTreeDTO;
import com.nova.admin.modules.system.dto.MenuUpdateRequest;
import com.nova.admin.modules.system.entity.SysMenu;
import com.nova.admin.modules.system.entity.SysRoleMenu;
import com.nova.admin.modules.system.entity.SysUserRole;
import com.nova.admin.modules.system.mapper.SysMenuMapper;
import com.nova.admin.modules.system.mapper.SysRoleMenuMapper;
import com.nova.admin.modules.system.mapper.SysUserRoleMapper;
import com.nova.admin.modules.system.service.SysMenuService;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 菜单 Service 实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SysMenuServiceImpl extends ServiceImpl<SysMenuMapper, SysMenu> implements SysMenuService {

    private final SysRoleMenuMapper roleMenuMapper;
    private final SysUserRoleMapper userRoleMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public List<MenuTreeDTO> getMenuTree() {
        List<SysMenu> allMenus = list(new LambdaQueryWrapper<SysMenu>()
                .orderByAsc(SysMenu::getSort));
        return buildTree(allMenus);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createMenu(MenuCreateRequest req) {
        SysMenu menu = new SysMenu();
        populateMenuFields(menu, req.getParentId(), req.getName(), req.getType(), req.getPerms(),
                req.getPath(), req.getComponent(), req.getRedirect(), req.getIcon(),
                req.getSort(), req.getVisible(), req.getStatus(), req.getKeepAlive(), req.getAlwaysShow());

        Long userId = SecurityUtils.requireUserId();
        menu.setCreateBy(userId);
        menu.setUpdateBy(userId);

        save(menu);
        log.info("创建菜单成功，id={}, name={}, operator={}", menu.getId(), menu.getName(), userId);
        return menu.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateMenu(MenuUpdateRequest req) {
        // 检查存在
        SysMenu existing = getById(req.getId());
        if (existing == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "菜单不存在");
        }

        SysMenu menu = new SysMenu();
        menu.setId(req.getId());
        populateMenuFields(menu, req.getParentId(), req.getName(), req.getType(), req.getPerms(),
                req.getPath(), req.getComponent(), req.getRedirect(), req.getIcon(),
                req.getSort(), req.getVisible(), req.getStatus(), req.getKeepAlive(), req.getAlwaysShow());

        Long operatorId = SecurityUtils.requireUserId();
        menu.setUpdateBy(operatorId);

        updateById(menu);
        publishMenuUserInvalidation(req.getId());
        log.info("更新菜单成功，id={}, operator={}", req.getId(), operatorId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteMenu(Long id) {
        // 检查存在
        SysMenu existing = getById(id);
        if (existing == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "菜单不存在");
        }

        // 检查是否有子菜单
        long childCount = count(new LambdaQueryWrapper<SysMenu>()
                .eq(SysMenu::getParentId, id));
        if (childCount > 0) {
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "该菜单下存在子菜单，无法删除");
        }

        // 检查是否有角色引用
        long roleCount = roleMenuMapper.selectCount(new LambdaQueryWrapper<SysRoleMenu>()
                .eq(SysRoleMenu::getMenuId, id));
        if (roleCount > 0) {
            throw new BizException(ResultCode.DATA_OPERATION_FAILED, "该菜单已被角色引用，无法删除");
        }

        // 逻辑删除
        removeById(id);

        Long operatorId = SecurityUtils.requireUserId();
        log.info("删除菜单成功，id={}, operator={}", id, operatorId);
    }

    // ==================== 私有方法 ====================

    /**
     * 填充菜单字段
     */
    private void populateMenuFields(SysMenu menu, Long parentId, String name, String type, String perms,
                                    String path, String component, String redirect, String icon,
                                    Integer sort, Integer visible, Integer status, Integer keepAlive, Integer alwaysShow) {
        menu.setParentId(parentId);
        menu.setName(name);
        menu.setType(type);
        menu.setPerms(perms);
        menu.setPath(path);
        menu.setComponent(component);
        menu.setRedirect(redirect);
        menu.setIcon(icon);
        menu.setSort(sort != null ? sort : 0);
        menu.setVisible(visible != null ? visible : 1);
        menu.setStatus(status != null ? status : 1);
        menu.setKeepAlive(keepAlive != null ? keepAlive : 0);
        menu.setAlwaysShow(alwaysShow != null ? alwaysShow : 0);
    }

    /**
     * 组装树形结构
     */
    private List<MenuTreeDTO> buildTree(List<SysMenu> allMenus) {
        // 转换为 DTO
        List<MenuTreeDTO> dtoList = allMenus.stream()
                .map(this::toDTO)
                .toList();

        // 按 parentId 分组
        Map<Long, List<MenuTreeDTO>> parentMap = dtoList.stream()
                .collect(Collectors.groupingBy(MenuTreeDTO::getParentId));

        // 为每个节点设置 children
        for (MenuTreeDTO dto : dtoList) {
            List<MenuTreeDTO> children = parentMap.getOrDefault(dto.getId(), new ArrayList<>());
            // 子节点按 sort 升序排序
            children.sort(java.util.Comparator.comparingInt(
                    c -> c.getSort() == null ? 0 : c.getSort()));
            dto.setChildren(children);
        }

        // 根节点 parentId == 0，按 sort 升序排序
        List<MenuTreeDTO> roots = parentMap.getOrDefault(0L, new ArrayList<>());
        roots.sort(java.util.Comparator.comparingInt(
                r -> r.getSort() == null ? 0 : r.getSort()));
        return roots;
    }

    /**
     * SysMenu 转 MenuTreeDTO
     */
    private MenuTreeDTO toDTO(SysMenu menu) {
        return getMenuTreeDTO(menu);
    }

    public static MenuTreeDTO getMenuTreeDTO(SysMenu menu) {
        return MenuTreeDTO.builder()
                .id(menu.getId())
                .parentId(menu.getParentId())
                .name(menu.getName())
                .type(menu.getType())
                .perms(menu.getPerms())
                .path(menu.getPath())
                .component(menu.getComponent())
                .redirect(menu.getRedirect())
                .icon(menu.getIcon())
                .sort(menu.getSort())
                .visible(menu.getVisible())
                .status(menu.getStatus())
                .keepAlive(menu.getKeepAlive())
                .alwaysShow(menu.getAlwaysShow())
                .build();
    }

    private void publishMenuUserInvalidation(Long menuId) {
        Set<Long> roleIds = roleMenuMapper.selectList(new LambdaQueryWrapper<SysRoleMenu>()
                        .eq(SysRoleMenu::getMenuId, menuId))
                .stream()
                .map(SysRoleMenu::getRoleId)
                .collect(Collectors.toSet());
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
