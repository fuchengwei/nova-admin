package com.nova.admin.modules.auth.service;

import com.nova.admin.modules.auth.event.AuthorizationChangedEvent;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.security.LoginSession;
import com.nova.admin.security.LoginUser;
import com.nova.admin.security.SecurityUser;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Duration;
import java.util.Collections;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthSessionServiceTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Mock
    private RedisTemplate<String, Object> redisTemplate;

    @Mock
    private ValueOperations<String, Object> valueOperations;

    @Mock
    private SetOperations<String, Object> setOperations;

    @Mock
    private AuthSessionEventService authSessionEventService;

    @Mock
    private SysUserMapper userMapper;

    @Test
    void register_storesAccessAndRefreshSessionsWithExpectedExpirations() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(redisTemplate.opsForSet()).willReturn(setOperations);
        AuthSessionService service = service();
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
        AuthSessionService service = service();

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
        AuthSessionService service = service();

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
        AuthSessionService service = service();

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
        AuthSessionService service = service();

        service.revokeOtherSessions(1L, "access-current");

        verify(authSessionEventService).notifyRevoked("access-other");
        verify(redisTemplate).delete("nova:auth:session:access-other");
        verify(redisTemplate).delete("nova:auth:refresh:refresh-other");
    }

    @Test
    void revokeAllByUserId_silencesInitiatingBrowserAndNotifiesOtherSessions() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(redisTemplate.opsForSet()).willReturn(setOperations);
        LoginSession initiating = LoginSession.builder()
                .userId(1L).accessJti("access-current").refreshJti("refresh-current").build();
        LoginSession other = LoginSession.builder()
                .userId(1L).accessJti("access-other").refreshJti("refresh-other").build();
        given(setOperations.members("nova:auth:user-sessions:1"))
                .willReturn(Set.of("refresh-current", "refresh-other"));
        given(valueOperations.get("nova:auth:refresh:refresh-current")).willReturn(initiating);
        given(valueOperations.get("nova:auth:refresh:refresh-other")).willReturn(other);
        AuthSessionService service = service();

        service.revokeAllByUserId(1L, "access-current");

        verify(authSessionEventService, never()).notifyRevoked("access-current");
        verify(authSessionEventService).notifyRevoked("access-other");
        verify(redisTemplate).delete("nova:auth:session:access-current");
        verify(redisTemplate).delete("nova:auth:session:access-other");
        verify(redisTemplate).delete("nova:auth:user-sessions:1");
    }

    @Test
    void onAuthorizationChanged_keepsCurrentSessionRevokesOtherSessionsAndEvictsCurrentCache() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(redisTemplate.opsForSet()).willReturn(setOperations);
        LoginSession current = LoginSession.builder()
                .userId(1L).accessJti("access-current").refreshJti("refresh-current").build();
        LoginSession other = LoginSession.builder()
                .userId(1L).accessJti("access-other").refreshJti("refresh-other").build();
        given(setOperations.members("nova:auth:user-sessions:1"))
                .willReturn(Set.of("refresh-current", "refresh-other"));
        given(valueOperations.get("nova:auth:refresh:refresh-current")).willReturn(current);
        given(valueOperations.get("nova:auth:refresh:refresh-other")).willReturn(other);
        setCurrentUser(1L, "operator", "access-current");

        service().onAuthorizationChanged(AuthorizationChangedEvent.of(1L));

        verify(authSessionEventService).notifyRevoked("access-other");
        verify(redisTemplate, never()).delete("nova:auth:session:access-current");
        verify(redisTemplate).delete("nova:auth:session:access-other");
        verify(redisTemplate).delete("nova:user:operator");
    }

    @Test
    void onAuthorizationChanged_revokesOtherUsersAndEvictsTheirCache() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(redisTemplate.opsForSet()).willReturn(setOperations);
        LoginSession session = LoginSession.builder()
                .userId(2L).accessJti("access-other-user").refreshJti("refresh-other-user").build();
        given(setOperations.members("nova:auth:user-sessions:2"))
                .willReturn(Set.of("refresh-other-user"));
        given(valueOperations.get("nova:auth:refresh:refresh-other-user")).willReturn(session);
        SysUser user = new SysUser();
        user.setAccount("other-user");
        given(userMapper.selectById(2L)).willReturn(user);

        service().onAuthorizationChanged(AuthorizationChangedEvent.revokeSessionsOf(Set.of(2L)));

        verify(authSessionEventService).notifyRevoked("access-other-user");
        verify(redisTemplate).delete("nova:user:other-user");
    }

    @Test
    void onAuthorizationChanged_permissionsRefreshKeepsSessionsAndNotifiesEveryDevice() {
        given(redisTemplate.opsForValue()).willReturn(valueOperations);
        given(redisTemplate.opsForSet()).willReturn(setOperations);
        LoginSession current = LoginSession.builder()
                .userId(1L).accessJti("access-current").refreshJti("refresh-current").build();
        LoginSession other = LoginSession.builder()
                .userId(1L).accessJti("access-other").refreshJti("refresh-other").build();
        given(setOperations.members("nova:auth:user-sessions:1"))
                .willReturn(Set.of("refresh-current", "refresh-other"));
        given(valueOperations.get("nova:auth:refresh:refresh-current")).willReturn(current);
        given(valueOperations.get("nova:auth:refresh:refresh-other")).willReturn(other);
        setCurrentUser(1L, "operator", "access-current");

        service().onAuthorizationChanged(AuthorizationChangedEvent.permissionsOf(1L));

        verify(redisTemplate).delete("nova:user:operator");
        verify(authSessionEventService).notifyAuthorizationChanged("access-current");
        verify(authSessionEventService).notifyAuthorizationChanged("access-other");
        verify(redisTemplate, never()).delete("nova:auth:session:access-current");
        verify(redisTemplate, never()).delete("nova:auth:session:access-other");
    }

    private AuthSessionService service() {
        return new AuthSessionService(redisTemplate, authSessionEventService, userMapper);
    }

    private void setCurrentUser(Long userId, String account, String jti) {
        LoginUser loginUser = LoginUser.builder().userId(userId).account(account).jti(jti).build();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        new SecurityUser(loginUser, ""), null, Collections.emptyList()));
    }
}
