package com.nova.admin.modules.auth.service;

import com.nova.admin.common.constant.Constants;
import com.nova.admin.modules.auth.event.AuthorizationChangedEvent;
import com.nova.admin.security.LoginSession;
import com.nova.admin.security.LoginUser;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/** 管理服务端登录会话及授权变更后的统一失效。 */
@Service
@RequiredArgsConstructor
public class AuthSessionService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final AuthSessionEventService authSessionEventService;

    public void register(LoginSession session, long accessExpireSeconds, long refreshExpireSeconds) {
        redisTemplate.opsForValue().set(sessionKey(session.getAccessJti()), session,
                Duration.ofSeconds(accessExpireSeconds));
        redisTemplate.opsForValue().set(refreshKey(session.getRefreshJti()), session,
                Duration.ofSeconds(refreshExpireSeconds));
        redisTemplate.opsForSet().add(userSessionsKey(session.getUserId()), session.getRefreshJti());
        redisTemplate.expire(userSessionsKey(session.getUserId()), Duration.ofSeconds(refreshExpireSeconds));
    }

    public boolean isActive(String accessJti) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(sessionKey(accessJti)));
    }

    public LoginSession findByRefreshJti(String refreshJti) {
        Object value = redisTemplate.opsForValue().get(refreshKey(refreshJti));
        return value instanceof LoginSession session ? session : null;
    }

    /**
     * 原子消费 refresh token 对应会话，防止同一个 refresh token 并发重放。
     */
    public LoginSession consumeRefreshSession(String refreshJti) {
        Object value = redisTemplate.opsForValue().getAndDelete(refreshKey(refreshJti));
        if (!(value instanceof LoginSession session)) {
            return null;
        }
        redisTemplate.delete(sessionKey(session.getAccessJti()));
        redisTemplate.opsForSet().remove(userSessionsKey(session.getUserId()), refreshJti);
        return session;
    }

    public LoginSession findByAccessJti(String accessJti) {
        Object value = redisTemplate.opsForValue().get(sessionKey(accessJti));
        return value instanceof LoginSession session ? session : null;
    }

    public List<LoginSession> getActiveSessions() {
        Set<String> keys = redisTemplate.keys(Constants.REDIS_KEY_AUTH_SESSION + "*");
        if (keys == null || keys.isEmpty()) {
            return List.of();
        }
        List<LoginSession> sessions = new ArrayList<>();
        for (String key : keys) {
            Object value = redisTemplate.opsForValue().get(key);
            if (value instanceof LoginSession session) {
                sessions.add(session);
            }
        }
        return sessions;
    }

    public void revokeSession(String accessJti) {
        LoginSession session = findByAccessJti(accessJti);
        if (session == null) {
            return;
        }
        revokeSession(session);
    }

    public void revokeSession(LoginSession session) {
        authSessionEventService.notifyRevoked(session.getAccessJti());
        redisTemplate.delete(sessionKey(session.getAccessJti()));
        redisTemplate.delete(refreshKey(session.getRefreshJti()));
        redisTemplate.opsForSet().remove(userSessionsKey(session.getUserId()), session.getRefreshJti());
    }

    public void revokeAllByUserId(Long userId) {
        String userSessionsKey = userSessionsKey(userId);
        Set<Object> refreshJtis = redisTemplate.opsForSet().members(userSessionsKey);
        if (refreshJtis != null) {
            for (Object refreshJti : refreshJtis) {
                if (refreshJti instanceof String value) {
                    LoginSession session = findByRefreshJti(value);
                    if (session != null) {
                        revokeSession(session);
                    }
                }
            }
        }
        redisTemplate.delete(userSessionsKey);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onAuthorizationChanged(AuthorizationChangedEvent event) {
        event.userIds().forEach(this::revokeAllByUserId);
    }

    public static LoginSession of(LoginUser user, String accessJti, String refreshJti) {
        return LoginSession.builder()
                .accessJti(accessJti)
                .refreshJti(refreshJti)
                .userId(user.getUserId())
                .account(user.getAccount())
                .nickname(user.getNickname())
                .deptId(user.getDeptId())
                .loginTime(user.getLoginTime())
                .loginIp(user.getLoginIp())
                .build();
    }

    private static String sessionKey(String accessJti) {
        return Constants.REDIS_KEY_AUTH_SESSION + accessJti;
    }

    private static String refreshKey(String refreshJti) {
        return Constants.REDIS_KEY_AUTH_REFRESH + refreshJti;
    }

    private static String userSessionsKey(Long userId) {
        return Constants.REDIS_KEY_AUTH_USER_SESSIONS + userId;
    }
}
