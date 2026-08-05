package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nova.admin.modules.system.entity.SysApiPermission;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface SysApiPermissionMapper extends BaseMapper<SysApiPermission> {

    /** 查询用户通过公开、角色或直接授权获得的独立接口权限。 */
    @Select("""
            SELECT DISTINCT ap.permission
            FROM sys_api_permission ap
            WHERE ap.deleted = 0
              AND ap.status = 1
              AND ap.permission IS NOT NULL
              AND ap.permission <> ''
              AND (
                  ap.public_access = 1
                  OR EXISTS (
                      SELECT 1
                      FROM sys_role_api_permission rap
                      INNER JOIN sys_user_role ur ON ur.role_id = rap.role_id
                      WHERE rap.api_permission_id = ap.id
                        AND ur.user_id = #{userId}
                  )
                  OR EXISTS (
                      SELECT 1
                      FROM sys_user_api_permission uap
                      WHERE uap.api_permission_id = ap.id
                        AND uap.user_id = #{userId}
                  )
              )
            """)
    List<String> selectPermsByUserId(Long userId);
}
