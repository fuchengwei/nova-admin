package com.nova.admin.modules.auth.service;

import com.nova.admin.modules.system.dto.SecuritySettingsDTO;
import com.nova.admin.modules.system.service.SysConfigService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class LoginAttemptServiceTest {

    @Mock
    private SysConfigService sysConfigService;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @Test
    void recordFailure_usesConfiguredLockDuration() {
        given(sysConfigService.getSecuritySettings()).willReturn(securitySettings(3, 15));
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.increment("nova:login:fail:admin")).willReturn(1L);
        LoginAttemptService service = new LoginAttemptService(sysConfigService, redisTemplate);

        service.recordFailure("admin");

        verify(redisTemplate).expire("nova:login:fail:admin", Duration.ofMinutes(15));
    }

    @Test
    void isLocked_usesConfiguredFailureThreshold() {
        given(sysConfigService.getSecuritySettings()).willReturn(securitySettings(3, 15));
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(valueOperations.get("nova:login:fail:admin")).willReturn(3L);
        LoginAttemptService service = new LoginAttemptService(sysConfigService, redisTemplate);

        assertThat(service.isLocked("admin")).isTrue();
    }

    private SecuritySettingsDTO securitySettings(int maxAttempts, int lockMinutes) {
        SecuritySettingsDTO settings = new SecuritySettingsDTO();
        settings.setLoginLockMaxAttempts(maxAttempts);
        settings.setLoginLockMinutes(lockMinutes);
        return settings;
    }
}
