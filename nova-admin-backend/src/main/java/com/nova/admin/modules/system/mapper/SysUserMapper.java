package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nova.admin.modules.system.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    /** 根据用户名查询（联部门） */
    @Select("""
            SELECT u.*, d.name AS dept_name
            FROM sys_user u
            LEFT JOIN sys_dept d ON d.id = u.dept_id AND d.deleted = 0
            WHERE u.username = #{username} AND u.deleted = 0
            """)
    SysUser selectByUsername(String username);
}
