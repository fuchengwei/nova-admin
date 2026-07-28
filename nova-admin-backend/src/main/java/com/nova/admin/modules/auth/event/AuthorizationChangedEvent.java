package com.nova.admin.modules.auth.event;

import java.util.Set;

/** 授权数据已变更，事务提交后必须撤销受影响用户的会话。 */
public record AuthorizationChangedEvent(Set<Long> userIds) {

    public AuthorizationChangedEvent {
        userIds = Set.copyOf(userIds);
    }

    public static AuthorizationChangedEvent of(Long userId) {
        return new AuthorizationChangedEvent(Set.of(userId));
    }
}
