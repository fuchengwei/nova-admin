package com.nova.admin.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
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

    /** 角色自定义数据权限涉及的部门 ID（并集） */
    private Set<Long> customDeptIds;

    /** 1 表示该账号必须修改密码后才能继续使用业务功能。 */
    private Integer forcePasswordChange;

    /** 最近一次设置密码的时间，用于计算密码有效期。 */
    private LocalDateTime passwordChangedAt;

    /** 登录时间 */
    private Long loginTime;

    /** 登录 IP */
    private String loginIp;

    /** 当前 access token 的唯一标识（jti），用于精确黑名单（注销/踢下线） */
    private String jti;

    /** 为当前请求创建带有独立会话标识的副本，避免修改 Redis 中的共享缓存对象。 */
    public LoginUser copyWithJti(String accessJti) {
        return LoginUser.builder()
                .userId(userId)
                .account(account)
                .nickname(nickname)
                .deptId(deptId)
                .roles(roles)
                .permissions(permissions)
                .dataScope(dataScope)
                .customDeptIds(customDeptIds)
                .forcePasswordChange(forcePasswordChange)
                .passwordChangedAt(passwordChangedAt)
                .loginTime(loginTime)
                .loginIp(loginIp)
                .jti(accessJti)
                .build();
    }
}
