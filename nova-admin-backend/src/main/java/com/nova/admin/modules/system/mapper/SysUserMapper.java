package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.conditions.Wrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.toolkit.Constants;
import com.nova.admin.modules.system.datascope.DataScope;
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
     * 分页查询用户（数据权限过滤由 {@link DataScopeInnerInterceptor} 依据当前登录用户注入）。
     */
    @DataScope(deptColumn = "dept_id", userColumn = "create_by")
    @Select("<script>" +
            "SELECT u.*, d.name AS dept_name " +
            "FROM sys_user u " +
            "LEFT JOIN sys_dept d ON d.id = u.dept_id AND d.deleted = 0 " +
            "<where>" +
            "u.deleted = 0 " +
            "<if test=\"ew != null and ew.sqlSegment != null and ew.sqlSegment != ''\">AND ${ew.sqlSegment}</if>" +
            "</where> " +
            "ORDER BY u.create_time DESC" +
            "</script>")
    IPage<SysUser> selectUserPage(IPage<SysUser> page, @Param(Constants.WRAPPER) Wrapper<SysUser> wrapper);
}
