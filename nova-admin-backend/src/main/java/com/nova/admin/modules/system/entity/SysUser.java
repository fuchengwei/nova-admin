package com.nova.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.nova.admin.common.base.BaseDO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.time.LocalDateTime;

/**
 * 用户
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_user")
public class SysUser extends BaseDO {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private String username;
    private String password;
    private String nickname;
    private String realName;
    private String avatar;
    private String email;
    private String phone;
    /** 0 未知 1 男 2 女 */
    private Integer gender;
    private Long deptId;
    /** 1 是 0 否 */
    private Integer superAdmin;
    /** 1 启用 0 停用 */
    private Integer status;
    private LocalDateTime lastLoginTime;
    private String lastLoginIp;

    /** 联表查询用（非数据库字段） */
    @TableField(exist = false)
    private String deptName;
}
