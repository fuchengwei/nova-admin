package com.nova.admin.modules.auth.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.lang.reflect.Field;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class AuthSessionEventServiceTest {

    @Test
    void notifyUser_sendsNotificationToAllConnectedEmitters() throws Exception {
        AuthSessionEventService service = new AuthSessionEventService();
        SseEmitter first = mock(SseEmitter.class);
        SseEmitter second = mock(SseEmitter.class);
        Set<SseEmitter> emitters = ConcurrentHashMap.newKeySet();
        emitters.addAll(Set.of(first, second));
        userEmitters(service).put(7L, emitters);

        service.notifyUser(7L, 42L);

        verify(first).send(any(SseEmitter.SseEventBuilder.class));
        verify(second).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    void notifyUser_removesEmitterWhenSendingFails() throws Exception {
        AuthSessionEventService service = new AuthSessionEventService();
        SseEmitter broken = mock(SseEmitter.class);
        doThrow(new IOException("closed")).when(broken).send(any(SseEmitter.SseEventBuilder.class));
        Set<SseEmitter> emitters = ConcurrentHashMap.newKeySet();
        emitters.add(broken);
        userEmitters(service).put(7L, emitters);

        service.notifyUser(7L, 42L);

        org.assertj.core.api.Assertions.assertThat(userEmitters(service)).doesNotContainKey(7L);
    }

    @Test
    void sendHeartbeat_sendsKeepAliveCommentToAllSessionEmitters() throws Exception {
        AuthSessionEventService service = new AuthSessionEventService();
        SseEmitter first = mock(SseEmitter.class);
        SseEmitter second = mock(SseEmitter.class);
        Set<SseEmitter> emitters = ConcurrentHashMap.newKeySet();
        emitters.addAll(Set.of(first, second));
        sessionEmitters(service).put("jti-1", emitters);

        service.sendHeartbeat();

        verify(first).send(any(SseEmitter.SseEventBuilder.class));
        verify(second).send(any(SseEmitter.SseEventBuilder.class));
    }

    @SuppressWarnings("unchecked")
    private ConcurrentHashMap<Long, Set<SseEmitter>> userEmitters(AuthSessionEventService service)
            throws ReflectiveOperationException {
        Field field = AuthSessionEventService.class.getDeclaredField("userEmitters");
        field.setAccessible(true);
        return (ConcurrentHashMap<Long, Set<SseEmitter>>) field.get(service);
    }

    @SuppressWarnings("unchecked")
    private ConcurrentHashMap<String, Set<SseEmitter>> sessionEmitters(AuthSessionEventService service)
            throws ReflectiveOperationException {
        Field field = AuthSessionEventService.class.getDeclaredField("emitters");
        field.setAccessible(true);
        return (ConcurrentHashMap<String, Set<SseEmitter>>) field.get(service);
    }
}
