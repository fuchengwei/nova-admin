package com.nova.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import tools.jackson.databind.annotation.JsonSerialize;
import tools.jackson.databind.ser.std.ToStringSerializer;
import com.nova.admin.common.base.BaseDO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.time.LocalDateTime;
import java.util.List;

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
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    private String account;
    @JsonIgnore
    private String password;
    private String nickname;
    private String realName;
    private String avatar;
    private String email;
    private String phone;
    /** 0 未知 1 男 2 女 */
    private Integer gender;
    @JsonSerialize(using = ToStringSerializer.class)
    private Long deptId;
    /** 1 是 0 否 */
    private Integer superAdmin;
    /** 1 启用 0 停用 */
    private Integer status;
    /** 1 表示下次登录后必须修改密码 */
    private Integer forcePasswordChange;
    /** 最近一次设置密码的时间 */
    private LocalDateTime passwordChangedAt;
    private LocalDateTime lastLoginTime;
    private String lastLoginIp;

    /** 联表查询用（非数据库字段） */
    @TableField(exist = false)
    private String deptName;

    /** 用户角色ID列表（非数据库字段，分页查询时批量填充） */
    @TableField(exist = false)
    @JsonSerialize(contentUsing = ToStringSerializer.class)
    private List<Long> roleIds;
}
