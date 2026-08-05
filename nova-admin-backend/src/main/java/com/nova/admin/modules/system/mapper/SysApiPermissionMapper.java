package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nova.admin.modules.system.entity.SysApiPermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SysApiPermissionMapper extends BaseMapper<SysApiPermission> {

    /** 查询用户通过角色获得的独立接口权限。 */
    @Select("""
            SELECT DISTINCT ap.permission
            FROM sys_api_permission ap
            INNER JOIN sys_role_api_permission rap ON rap.api_permission_id = ap.id
            INNER JOIN sys_user_role ur ON ur.role_id = rap.role_id
            WHERE ur.user_id = #{userId}
              AND ap.deleted = 0
              AND ap.status = 1
              AND ap.permission IS NOT NULL
              AND ap.permission <> ''
            """)
    List<String> selectPermsByUserId(Long userId);
}
