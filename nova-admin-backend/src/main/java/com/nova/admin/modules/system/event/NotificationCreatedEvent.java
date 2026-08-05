package com.nova.admin.modules.system.event;

import java.util.Set;

/** 站内消息已提交，通知在线收件人刷新摘要。 */
public record NotificationCreatedEvent(Long messageId, Set<Long> userIds) {

    public NotificationCreatedEvent {
        userIds = Set.copyOf(userIds);
    }
}
