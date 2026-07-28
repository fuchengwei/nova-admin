package com.nova.admin.modules.auth.service;

import cn.hutool.captcha.CaptchaUtil;
import cn.hutool.captcha.LineCaptcha;
import cn.hutool.core.util.IdUtil;
import com.nova.admin.config.NovaProperties;
import com.nova.admin.common.constant.Constants;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.modules.auth.dto.CaptchaResponse;
import com.nova.admin.modules.system.service.SysConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * 图形验证码服务
 */
@Service
@RequiredArgsConstructor
public class CaptchaService {

    private final NovaProperties novaProperties;
    private final SysConfigService sysConfigService;
    private final RedisTemplate<String, Object> redisTemplate;

    /** 生成图形验证码 */
    public CaptchaResponse generate() {
        if (!Boolean.TRUE.equals(sysConfigService.getSecuritySettings().getCaptchaEnabled())) {
            return CaptchaResponse.builder().enabled(false).build();
        }
        LineCaptcha captcha = CaptchaUtil.createLineCaptcha(120, 40, 4, 30);
        String key = IdUtil.fastSimpleUUID();
        String code = captcha.getCode().toLowerCase();
        int expireSeconds = novaProperties.getSecurity().getCaptcha().getExpireMinutes() * 60;
        redisTemplate.opsForValue().set(
                Constants.REDIS_KEY_CAPTCHA + key,
                code,
                Duration.ofSeconds(expireSeconds));

        return CaptchaResponse.builder()
                .enabled(true)
                .captchaKey(key)
                .captchaImage("data:image/png;base64," + captcha.getImageBase64())
                .expireSeconds((long) expireSeconds)
                .build();
    }

    /** 校验图形验证码（校验后立即删除） */
    public void verify(String key, String input) {
        if (!Boolean.TRUE.equals(sysConfigService.getSecuritySettings().getCaptchaEnabled())) {
            return;
        }
        if (key == null || input == null) {
            throw new BizException(ResultCode.CAPTCHA_INVALID);
        }
        String stored = (String) redisTemplate.opsForValue().get(Constants.REDIS_KEY_CAPTCHA + key);
        if (stored == null) {
            throw new BizException(ResultCode.CAPTCHA_INVALID);
        }
        if (!stored.equalsIgnoreCase(input.trim())) {
            redisTemplate.delete(Constants.REDIS_KEY_CAPTCHA + key);
            throw new BizException(ResultCode.CAPTCHA_INVALID);
        }
        redisTemplate.delete(Constants.REDIS_KEY_CAPTCHA + key);
    }
}
