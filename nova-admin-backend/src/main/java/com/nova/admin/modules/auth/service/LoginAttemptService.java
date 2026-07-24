package com.nova.admin.modules.auth.service;

import com.nova.admin.config.NovaProperties;
import com.nova.admin.common.constant.Constants;
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

    private final NovaProperties novaProperties;
    private final RedisTemplate<String, Object> redisTemplate;

    private String key(String account) {
        return Constants.REDIS_KEY_LOGIN_FAIL + account;
    }

    /** 记录一次失败，返回当前累计失败次数 */
    public long recordFailure(String account) {
        String k = key(account);
        Long count = redisTemplate.opsForValue().increment(k);
        if (count != null && count == 1L) {
            redisTemplate.expire(k, Duration.ofMinutes(
                    novaProperties.getSecurity().getLogin().getLockMinutes()));
        }
        return count == null ? 0L : count;
    }

    /** 是否已被锁定 */
    public boolean isLocked(String account) {
        Object v = redisTemplate.opsForValue().get(key(account));
        if (v == null) {
            return false;
        }
        long count = Long.parseLong(v.toString());
        return count >= novaProperties.getSecurity().getLogin().getMaxRetryCount();
    }

    /** 登录成功，重置计数 */
    public void reset(String account) {
        redisTemplate.delete(key(account));
    }
}
