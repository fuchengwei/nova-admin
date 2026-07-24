package com.nova.admin.modules.system.service;

import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.security.LoginUser;
import com.nova.admin.security.SecurityUtils;
import com.nova.admin.modules.system.dto.MenuTreeDTO;
import com.nova.admin.modules.system.dto.UserInfoDTO;
import com.nova.admin.modules.system.entity.SysMenu;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysMenuMapper;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 系统侧用户/菜单查询（被 controller 与 AuthService 共用）
 */
@Service
@RequiredArgsConstructor
public class AuthQueryService {

    private final SysUserMapper userMapper;
    private final SysRoleMapper roleMapper;
    private final SysMenuMapper menuMapper;

    public UserInfoDTO currentUserInfo(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }
        // 角色/权限从缓存 LoginUser 取
        LoginUser lu = SecurityUtils.getLoginUser()
                .orElseThrow(() -> new BizException(ResultCode.UNAUTHORIZED));
        return UserInfoDTO.builder()
                .id(user.getId())
                .account(user.getAccount())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .email(user.getEmail())
                .phone(user.getPhone())
                .deptId(user.getDeptId())
                .deptName(user.getDeptName())
                .roles(lu.getRoles() == null ? List.of() : new ArrayList<>(lu.getRoles()))
                .permissions(lu.getPermissions() == null ? List.of() : new ArrayList<>(lu.getPermissions()))
                .build();
    }

    public List<MenuTreeDTO> currentUserMenuTree(Long userId) {
        SysUser user = userMapper.selectById(userId);
        if (user == null) {
            throw new BizException(ResultCode.USER_NOT_FOUND);
        }
        // 超级管理员返回全部菜单（仅M/C类型），普通用户按权限过滤
        List<SysMenu> menus;
        if (user.getSuperAdmin() != null && user.getSuperAdmin() == 1) {
            menus = menuMapper.selectList(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<SysMenu>()
                    .eq(SysMenu::getStatus, 1)
                    .in(SysMenu::getType, "M", "C")
                    .orderByAsc(SysMenu::getSort));
        } else {
            menus = menuMapper.selectMenusByUserId(userId);
        }

        List<MenuTreeDTO> all = new ArrayList<>();
        Map<Long, MenuTreeDTO> map = new HashMap<>();
        for (SysMenu m : menus) {
            MenuTreeDTO dto = toDto(m);
            all.add(dto);
            map.put(dto.getId(), dto);
        }
        List<MenuTreeDTO> roots = new ArrayList<>();
        for (MenuTreeDTO dto : all) {
            if (dto.getParentId() == null || dto.getParentId() == 0L) {
                roots.add(dto);
            } else {
                MenuTreeDTO parent = map.get(dto.getParentId());
                if (parent != null) {
                    parent.getChildren().add(dto);
                } else {
                    roots.add(dto);
                }
            }
        }
        // 根节点与每个节点的子节点都按 sort 升序排序
        roots.sort(java.util.Comparator.comparingInt(
                d -> d.getSort() == null ? 0 : d.getSort()));
        for (MenuTreeDTO dto : all) {
            dto.getChildren().sort(java.util.Comparator.comparingInt(
                    c -> c.getSort() == null ? 0 : c.getSort()));
        }
        return roots;
    }

    private MenuTreeDTO toDto(SysMenu m) {
        return MenuTreeDTO.builder()
                .id(m.getId())
                .parentId(m.getParentId())
                .name(m.getName())
                .type(m.getType())
                .perms(m.getPerms())
                .path(m.getPath())
                .component(m.getComponent())
                .redirect(m.getRedirect())
                .icon(m.getIcon())
                .sort(m.getSort())
                .visible(m.getVisible())
                .status(m.getStatus())
                .keepAlive(m.getKeepAlive())
                .alwaysShow(m.getAlwaysShow())
                .build();
    }
}
