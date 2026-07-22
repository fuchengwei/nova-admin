package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nova.admin.modules.system.entity.SysMenu;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SysMenuMapper extends BaseMapper<SysMenu> {

    /** 查询用户的所有菜单（仅 M/C 类型，路由用） */
    @Select("""
            SELECT DISTINCT m.* FROM sys_menu m
            INNER JOIN sys_role_menu rm ON rm.menu_id = m.id
            INNER JOIN sys_user_role ur ON ur.role_id = rm.role_id
            WHERE ur.user_id = #{userId}
              AND m.deleted = 0
              AND m.status = 1
              AND m.type IN ('M', 'C')
            ORDER BY m.sort
            """)
    List<SysMenu> selectMenusByUserId(Long userId);

    /** 查询用户的所有权限标识（perms，用于接口鉴权） */
    @Select("""
            SELECT DISTINCT m.perms FROM sys_menu m
            INNER JOIN sys_role_menu rm ON rm.menu_id = m.id
            INNER JOIN sys_user_role ur ON ur.role_id = rm.role_id
            WHERE ur.user_id = #{userId}
              AND m.deleted = 0
              AND m.status = 1
              AND m.perms IS NOT NULL
              AND m.perms <> ''
            """)
    List<String> selectPermsByUserId(Long userId);
}
