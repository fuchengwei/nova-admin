package com.nova.admin.modules.system.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.nova.admin.modules.system.dto.MenuCreateRequest;
import com.nova.admin.modules.system.dto.MenuTreeDTO;
import com.nova.admin.modules.system.dto.MenuUpdateRequest;
import com.nova.admin.modules.system.entity.SysMenu;

import java.util.List;

/**
 * 菜单 Service
 */
public interface SysMenuService extends IService<SysMenu> {

    /**
     * 获取所有菜单树
     */
    List<MenuTreeDTO> getMenuTree();

    /**
     * 创建菜单
     */
    Long createMenu(MenuCreateRequest req);

    /**
     * 更新菜单
     */
    void updateMenu(MenuUpdateRequest req);

    /**
     * 删除菜单（检查是否有子菜单、是否有角色引用）
     */
    void deleteMenu(Long id);
}