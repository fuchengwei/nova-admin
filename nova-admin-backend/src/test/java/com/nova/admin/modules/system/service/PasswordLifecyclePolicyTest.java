package com.nova.admin.modules.system.service;

import com.nova.admin.security.LoginUser;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class PasswordLifecyclePolicyTest {

    @Mock
    private SysConfigService sysConfigService;

    @InjectMocks
    private PasswordLifecyclePolicy passwordLifecyclePolicy;

    @Test
    void isPasswordChangeRequired_whenAdministratorForcedChange_returnsTrue() {
        LoginUser user = LoginUser.builder().forcePasswordChange(1).build();

        assertThat(passwordLifecyclePolicy.isPasswordChangeRequired(user)).isTrue();
    }

    @Test
    void isPasswordChangeRequired_whenPasswordExpired_returnsTrue() {
        LoginUser user = LoginUser.builder()
                .forcePasswordChange(0)
                .passwordChangedAt(LocalDateTime.now().minusDays(90))
                .build();
        given(sysConfigService.isPasswordExpired(user.getPasswordChangedAt())).willReturn(true);

        assertThat(passwordLifecyclePolicy.isPasswordChangeRequired(user)).isTrue();
    }

    @Test
    void isPasswordChangeRequired_whenPasswordIsCurrent_returnsFalse() {
        LoginUser user = LoginUser.builder()
                .forcePasswordChange(0)
                .passwordChangedAt(LocalDateTime.now())
                .build();
        given(sysConfigService.isPasswordExpired(user.getPasswordChangedAt())).willReturn(false);

        assertThat(passwordLifecyclePolicy.isPasswordChangeRequired(user)).isFalse();
    }
}
