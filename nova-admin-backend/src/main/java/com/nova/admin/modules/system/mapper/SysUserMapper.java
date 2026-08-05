package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.nova.admin.modules.system.datascope.DataScope;
import com.nova.admin.modules.system.dto.UserPageQuery;
import com.nova.admin.modules.system.entity.SysUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Collection;
import java.util.List;

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

    @DataScope(deptAlias = "u", userAlias = "u")
    List<SysUser> selectUserList(@Param("query") UserPageQuery query);

    /** 查询指定角色下所有启用用户的 ID。 */
    @Select("""
            SELECT DISTINCT u.id
            FROM sys_user u
            INNER JOIN sys_user_role ur ON ur.user_id = u.id
            INNER JOIN sys_role r ON r.id = ur.role_id
            WHERE u.deleted = 0
              AND u.status = 1
              AND r.deleted = 0
              AND r.status = 1
              AND r.code = #{roleCode}
            """)
    List<Long> selectEnabledUserIdsByRoleCode(@Param("roleCode") String roleCode);

    /** 查询全部启用用户的 ID。 */
    List<Long> selectEnabledUserIds();

    /** 查询指定 ID 中仍处于启用状态的用户。 */
    List<Long> selectEnabledUserIdsByIds(@Param("userIds") Collection<Long> userIds);

    /** 查询指定启用角色下的启用用户，结果按用户去重。 */
    List<Long> selectEnabledUserIdsByRoleIds(@Param("roleIds") Collection<Long> roleIds);
}
