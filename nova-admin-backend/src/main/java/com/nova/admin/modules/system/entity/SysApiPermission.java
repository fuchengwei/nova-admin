package com.nova.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.nova.admin.common.base.BaseDO;
import lombok.Data;
import lombok.EqualsAndHashCode;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;

import java.io.Serial;

/** 独立接口权限。 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_api_permission")
public class SysApiPermission extends BaseDO {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String permission;
    private String name;
    private Integer status;
    private Integer publicAccess;
}
