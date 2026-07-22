package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nova.admin.modules.system.entity.SysRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SysRoleMapper extends BaseMapper<SysRole> {

    /** 查询用户的所有角色 */
    @Select("""
            SELECT r.* FROM sys_role r
            INNER JOIN sys_user_role ur ON ur.role_id = r.id
            WHERE ur.user_id = #{userId} AND r.deleted = 0
            ORDER BY r.sort
            """)
    List<SysRole> selectRolesByUserId(Long userId);

    /** 查询角色编码（用于权限组装） */
    @Select("""
            SELECT DISTINCT r.code FROM sys_role r
            INNER JOIN sys_user_role ur ON ur.role_id = r.id
            WHERE ur.user_id = #{userId} AND r.deleted = 0
            """)
    List<String> selectRoleCodesByUserId(Long userId);

    /** 查询用户所有角色的数据权限集合（用于计算最宽的数据范围） */
    @Select("""
            SELECT DISTINCT r.data_scope FROM sys_role r
            INNER JOIN sys_user_role ur ON ur.role_id = r.id
            WHERE ur.user_id = #{userId} AND r.deleted = 0 AND r.data_scope IS NOT NULL
            """)
    List<Integer> selectDataScopesByUserId(Long userId);
}
