package com.nova.admin.modules.auth.service;

import com.nova.admin.modules.system.event.NotificationCreatedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** 向已连接的浏览器主动发送会话及权限变更通知。 */
@Slf4j
@Service
public class AuthSessionEventService {

    private static final long HEARTBEAT_INTERVAL_MS = 15_000L;

    private final ConcurrentHashMap<String, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, Set<SseEmitter>> userEmitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String accessJti, Long userId) {
        SseEmitter emitter = new SseEmitter(0L);
        Set<SseEmitter> sessionEmitters = emitters.computeIfAbsent(accessJti, ignored -> ConcurrentHashMap.newKeySet());
        sessionEmitters.add(emitter);
        Set<SseEmitter> recipientEmitters = userEmitters.computeIfAbsent(userId, ignored -> ConcurrentHashMap.newKeySet());
        recipientEmitters.add(emitter);
        emitter.onCompletion(() -> remove(accessJti, userId, emitter));
        emitter.onTimeout(() -> remove(accessJti, userId, emitter));
        emitter.onError(error -> remove(accessJti, userId, emitter));
        return emitter;
    }

    /** 定期写入 SSE comment，避免反向代理将长期无业务事件的连接判定为空闲。 */
    @Scheduled(fixedDelay = HEARTBEAT_INTERVAL_MS)
    void sendHeartbeat() {
        emitters.forEach((accessJti, sessionEmitters) -> {
            for (SseEmitter emitter : sessionEmitters) {
                try {
                    emitter.send(SseEmitter.event().comment("keep-alive"));
                } catch (IOException e) {
                    remove(accessJti, emitter);
                    log.debug("发送 SSE 心跳失败: {}", e.getMessage());
                }
            }
        });
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

    /** 事务提交后通知用户刷新站内消息摘要。 */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onNotificationCreated(NotificationCreatedEvent event) {
        for (Long userId : event.userIds()) {
            notifyUser(userId, event.messageId());
        }
    }

    void notifyUser(Long userId, Long messageId) {
        Set<SseEmitter> recipientEmitters = userEmitters.get(userId);
        if (recipientEmitters == null) {
            return;
        }
        for (SseEmitter emitter : recipientEmitters) {
            try {
                emitter.send(SseEmitter.event().name("notification-created").data(messageId));
            } catch (IOException e) {
                removeEmitter(userId, emitter);
                log.debug("发送站内消息通知失败: {}", e.getMessage());
            }
        }
    }

    private void remove(String accessJti, Long userId, SseEmitter emitter) {
        removeSessionEmitter(accessJti, emitter);
        removeEmitter(userId, emitter);
    }

    private void remove(String accessJti, SseEmitter emitter) {
        removeSessionEmitter(accessJti, emitter);
        userEmitters.forEach((userId, recipientEmitters) -> removeEmitter(userId, emitter));
    }

    private void removeSessionEmitter(String accessJti, SseEmitter emitter) {
        emitters.computeIfPresent(accessJti, (ignored, sessionEmitters) -> {
            sessionEmitters.remove(emitter);
            return sessionEmitters.isEmpty() ? null : sessionEmitters;
        });
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        userEmitters.computeIfPresent(userId, (ignored, recipientEmitters) -> {
            recipientEmitters.remove(emitter);
            return recipientEmitters.isEmpty() ? null : recipientEmitters;
        });
    }
}
