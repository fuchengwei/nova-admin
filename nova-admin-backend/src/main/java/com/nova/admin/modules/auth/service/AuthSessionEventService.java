package com.nova.admin.modules.auth.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** 向已连接的浏览器主动发送会话及权限变更通知。 */
@Slf4j
@Service
public class AuthSessionEventService {

    private final ConcurrentHashMap<String, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String accessJti) {
        SseEmitter emitter = new SseEmitter(0L);
        Set<SseEmitter> sessionEmitters = emitters.computeIfAbsent(accessJti, ignored -> ConcurrentHashMap.newKeySet());
        sessionEmitters.add(emitter);
        emitter.onCompletion(() -> remove(accessJti, emitter));
        emitter.onTimeout(() -> remove(accessJti, emitter));
        emitter.onError(error -> remove(accessJti, emitter));
        return emitter;
    }

    public void notifyRevoked(String accessJti) {
        Set<SseEmitter> sessionEmitters = emitters.remove(accessJti);
        if (sessionEmitters == null) {
            return;
        }
        for (SseEmitter emitter : sessionEmitters) {
            try {
                emitter.send(SseEmitter.event().name("session-revoked").data("REVOKED"));
            } catch (IOException e) {
                log.debug("发送会话撤销通知失败: {}", e.getMessage());
            } finally {
                emitter.complete();
            }
        }
    }

    /** 通知浏览器重新加载当前用户的权限和菜单，但不影响登录会话。 */
    public void notifyAuthorizationChanged(String accessJti) {
        Set<SseEmitter> sessionEmitters = emitters.get(accessJti);
        if (sessionEmitters == null) {
            return;
        }
        for (SseEmitter emitter : sessionEmitters) {
            try {
                emitter.send(SseEmitter.event().name("authorization-changed").data("CHANGED"));
            } catch (IOException e) {
                remove(accessJti, emitter);
                log.debug("发送权限刷新通知失败: {}", e.getMessage());
            }
        }
    }

    private void remove(String accessJti, SseEmitter emitter) {
        emitters.computeIfPresent(accessJti, (ignored, sessionEmitters) -> {
            sessionEmitters.remove(emitter);
            return sessionEmitters.isEmpty() ? null : sessionEmitters;
        });
    }
}
