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
import java.util.Set;

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

    @Test
    void getActiveSessionsByUserId_readsOnlySessionsOwnedByUser() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(redisTemplate.opsForSet()).willReturn(setOperations);
        LoginSession own = LoginSession.builder().userId(1L).accessJti("access-1").refreshJti("refresh-1").build();
        LoginSession stale = LoginSession.builder().userId(2L).accessJti("access-2").refreshJti("refresh-2").build();
        given(setOperations.members("nova:auth:user-sessions:1"))
                .willReturn(Set.of("refresh-1", "refresh-2"));
        given(valueOperations.get("nova:auth:refresh:refresh-1")).willReturn(own);
        given(valueOperations.get("nova:auth:refresh:refresh-2")).willReturn(stale);
        AuthSessionService service = new AuthSessionService(redisTemplate, authSessionEventService);

        assertThat(service.getActiveSessionsByUserId(1L)).containsExactly(own);
    }

    @Test
    void revokeOtherSessions_keepsCurrentSessionAndRevokesOthers() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(redisTemplate.opsForSet()).willReturn(setOperations);
        LoginSession current = LoginSession.builder().userId(1L).accessJti("access-current").refreshJti("refresh-current").build();
        LoginSession other = LoginSession.builder().userId(1L).accessJti("access-other").refreshJti("refresh-other").build();
        given(setOperations.members("nova:auth:user-sessions:1"))
                .willReturn(Set.of("refresh-current", "refresh-other"));
        given(valueOperations.get("nova:auth:refresh:refresh-current")).willReturn(current);
        given(valueOperations.get("nova:auth:refresh:refresh-other")).willReturn(other);
        AuthSessionService service = new AuthSessionService(redisTemplate, authSessionEventService);

        service.revokeOtherSessions(1L, "access-current");

        verify(authSessionEventService).notifyRevoked("access-other");
        verify(redisTemplate).delete("nova:auth:session:access-other");
        verify(redisTemplate).delete("nova:auth:refresh:refresh-other");
    }
}
