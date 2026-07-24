package com.nova.admin.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.util.Set;

/**
 * 登录用户信息（缓存到 Redis，挂在 SecurityContext）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginUser implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    /** 用户 ID */
    private Long userId;

    /** 账号 */
    private String account;

    /** 昵称 */
    private String nickname;

    /** 部门 ID */
    private Long deptId;

    /** 角色编码集合（如 ["super_admin", "ops"]） */
    private Set<String> roles;

    /** 权限标识集合（如 ["system:user:list", ...]） */
    private Set<String> permissions;

    /** 数据权限范围（取最高级） */
    private Integer dataScope;

    /** 登录时间 */
    private Long loginTime;

    /** 登录 IP */
    private String loginIp;

    /** 当前 access token 的唯一标识（jti），用于精确黑名单（注销/踢下线） */
    private String jti;
}
