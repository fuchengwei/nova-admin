package com.nova.admin.modules.system.service;

import com.nova.admin.security.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** 统一计算账号是否需要修改密码，供认证和接口访问控制复用。 */
@Component
@RequiredArgsConstructor
public class PasswordLifecyclePolicy {

    private final SysConfigService sysConfigService;

    public boolean isPasswordChangeRequired(LoginUser user) {
        return Integer.valueOf(1).equals(user.getForcePasswordChange())
                || sysConfigService.isPasswordExpired(user.getPasswordChangedAt());
    }
}
