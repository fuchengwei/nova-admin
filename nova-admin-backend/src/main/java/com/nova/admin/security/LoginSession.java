package com.nova.admin.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;

/**
 * 服务端登记的登录会话。
 *
 * <p>access token 的 jti 是会话主键。会话不存在时，即使 JWT 尚未过期也不能通过认证，
 * 从而让禁用账号、改密和权限变更能够立即生效。</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginSession implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private String accessJti;
    private String refreshJti;
    private Long userId;
    private String account;
    private String nickname;
    private Long deptId;
    private Long loginTime;
    private String loginIp;
}
