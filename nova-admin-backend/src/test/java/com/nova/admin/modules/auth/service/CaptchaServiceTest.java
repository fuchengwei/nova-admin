package com.nova.admin.modules.auth.service;

import com.nova.admin.config.NovaProperties;
import com.nova.admin.modules.system.dto.SecuritySettingsDTO;
import com.nova.admin.modules.system.service.SysConfigService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verifyNoInteractions;

@ExtendWith(MockitoExtension.class)
class CaptchaServiceTest {

    @Mock
    private SysConfigService sysConfigService;

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Test
    void generate_whenCaptchaIsDisabled_returnsDisabledResponseWithoutRedisAccess() {
        SecuritySettingsDTO settings = new SecuritySettingsDTO();
        settings.setCaptchaEnabled(false);
        given(sysConfigService.getSecuritySettings()).willReturn(settings);
        CaptchaService service = new CaptchaService(new NovaProperties(), sysConfigService, redisTemplate);

        var response = service.generate();

        assertThat(response.getEnabled()).isFalse();
        assertThat(response.getCaptchaKey()).isNull();
        verifyNoInteractions(redisTemplate);
    }

    @Test
    void verify_whenCaptchaIsDisabled_skipsCaptchaValidation() {
        SecuritySettingsDTO settings = new SecuritySettingsDTO();
        settings.setCaptchaEnabled(false);
        given(sysConfigService.getSecuritySettings()).willReturn(settings);
        CaptchaService service = new CaptchaService(new NovaProperties(), sysConfigService, redisTemplate);

        service.verify(null, null);

        verifyNoInteractions(redisTemplate);
    }
}
