package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.nova.admin.modules.system.datascope.DataScope;
import com.nova.admin.modules.system.dto.UserPageQuery;
import com.nova.admin.modules.system.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {

    /** 根据账号查询（联部门） */
    @Select("""
            SELECT u.*, d.name AS dept_name
            FROM sys_user u
            LEFT JOIN sys_dept d ON d.id = u.dept_id AND d.deleted = 0
            WHERE u.account = #{account} AND u.deleted = 0
            """)
    SysUser selectByAccount(String account);

    /**
     * 分页查询用户（数据权限过滤由 {@link DataScope} 依据当前登录用户注入）。
     * SQL 定义在 mapper/system/SysUserMapper.xml
     */
    @DataScope(deptAlias = "u", userAlias = "u")
    IPage<SysUser> selectUserPage(IPage<SysUser> page, @Param("query") UserPageQuery query);
}
