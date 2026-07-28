package com.nova.admin.modules.auth.service;

import com.nova.admin.security.LoginSession;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthSessionServiceTest {

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @Mock
    private SetOperations<String, Object> setOperations;

    @Mock
    private AuthSessionEventService authSessionEventService;

    @Test
    void register_storesAccessAndRefreshSessionsWithExpectedExpirations() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(redisTemplate.opsForSet()).willReturn(setOperations);
        AuthSessionService service = new AuthSessionService(redisTemplate, authSessionEventService);
        LoginSession session = LoginSession.builder()
                .accessJti("access-jti")
                .refreshJti("refresh-jti")
                .userId(1L)
                .build();

        service.register(session, 900L, 604800L);

        verify(valueOperations).set("nova:auth:session:access-jti", session, Duration.ofSeconds(900L));
        verify(valueOperations).set("nova:auth:refresh:refresh-jti", session, Duration.ofSeconds(604800L));
        verify(setOperations).add("nova:auth:user-sessions:1", "refresh-jti");
        verify(redisTemplate).expire("nova:auth:user-sessions:1", Duration.ofSeconds(604800L));
    }

    @Test
    void consumeRefreshSession_removesBothTokenReferences() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(redisTemplate.opsForSet()).willReturn(setOperations);
        LoginSession session = LoginSession.builder()
                .accessJti("access-jti")
                .refreshJti("refresh-jti")
                .userId(1L)
                .build();
        given(valueOperations.getAndDelete("nova:auth:refresh:refresh-jti")).willReturn(session);
        AuthSessionService service = new AuthSessionService(redisTemplate, authSessionEventService);

        LoginSession consumed = service.consumeRefreshSession("refresh-jti");

        assertThat(consumed).isSameAs(session);
        verify(redisTemplate).delete("nova:auth:session:access-jti");
        verify(setOperations).remove("nova:auth:user-sessions:1", "refresh-jti");
    }

    @Test
    void revokeSession_notifiesTheConnectedBrowserBeforeRemovingTokenReferences() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(redisTemplate.opsForSet()).willReturn(setOperations);
        LoginSession session = LoginSession.builder()
                .accessJti("access-jti")
                .refreshJti("refresh-jti")
                .userId(1L)
                .build();
        given(valueOperations.get("nova:auth:session:access-jti")).willReturn(session);
        AuthSessionService service = new AuthSessionService(redisTemplate, authSessionEventService);

        service.revokeSession("access-jti");

        verify(authSessionEventService).notifyRevoked("access-jti");
        verify(redisTemplate).delete("nova:auth:session:access-jti");
        verify(redisTemplate).delete("nova:auth:refresh:refresh-jti");
        verify(setOperations).remove("nova:auth:user-sessions:1", "refresh-jti");
    }
}
