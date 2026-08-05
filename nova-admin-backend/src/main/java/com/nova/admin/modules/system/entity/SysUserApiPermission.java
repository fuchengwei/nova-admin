package com.nova.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.io.Serial;
import java.io.Serializable;

/** 用户与独立接口权限关联。 */
@Data
@TableName("sys_user_api_permission")
public class SysUserApiPermission implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long userId;

    @JsonSerialize(using = ToStringSerializer.class)
    private Long apiPermissionId;
}
