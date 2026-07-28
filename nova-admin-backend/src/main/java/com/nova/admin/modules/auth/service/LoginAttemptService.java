package com.nova.admin.modules.auth.service;

import com.nova.admin.common.constant.Constants;
import com.nova.admin.modules.system.dto.SecuritySettingsDTO;
import com.nova.admin.modules.system.service.SysConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * 登录失败计数 & 账号锁定
 */
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final SysConfigService sysConfigService;
    private final RedisTemplate<String, Object> redisTemplate;

    private String key(String account) {
        return Constants.REDIS_KEY_LOGIN_FAIL + account;
    }

    /** 记录一次失败，返回当前累计失败次数 */
    public long recordFailure(String account) {
        SecuritySettingsDTO settings = sysConfigService.getSecuritySettings();
        String k = key(account);
        Long count = redisTemplate.opsForValue().increment(k);
        if (count != null && count == 1L) {
            redisTemplate.expire(k, Duration.ofMinutes(
                    settings.getLoginLockMinutes()));
        }
        return count == null ? 0L : count;
    }

    /** 是否已被锁定 */
    public boolean isLocked(String account) {
        SecuritySettingsDTO settings = sysConfigService.getSecuritySettings();
        Object v = redisTemplate.opsForValue().get(key(account));
        if (v == null) {
            return false;
        }
        long count = Long.parseLong(v.toString());
        return count >= settings.getLoginLockMaxAttempts();
    }

    /** 登录成功，重置计数 */
    public void reset(String account) {
        redisTemplate.delete(key(account));
    }
}
