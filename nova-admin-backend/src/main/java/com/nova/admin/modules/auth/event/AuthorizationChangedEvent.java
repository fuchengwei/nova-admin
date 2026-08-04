package com.nova.admin.modules.auth.event;

import java.util.Set;

/** 授权数据已变更，事务提交后刷新受影响用户的权限或会话。 */
public record AuthorizationChangedEvent(Set<Long> userIds, ChangeType changeType) {

    public enum ChangeType {
        /** 仅刷新权限缓存，保留所有登录会话。 */
        PERMISSIONS_REFRESH,
        /** 立即撤销所有登录会话。 */
        SESSION_INVALIDATION
    }

    public AuthorizationChangedEvent {
        userIds = Set.copyOf(userIds);
    }

    public static AuthorizationChangedEvent of(Long userId) {
        return revokeSessionsOf(userId);
    }

    public static AuthorizationChangedEvent permissionsOf(Long userId) {
        return new AuthorizationChangedEvent(Set.of(userId), ChangeType.PERMISSIONS_REFRESH);
    }

    public static AuthorizationChangedEvent permissionsOf(Set<Long> userIds) {
        return new AuthorizationChangedEvent(userIds, ChangeType.PERMISSIONS_REFRESH);
    }

    public static AuthorizationChangedEvent revokeSessionsOf(Long userId) {
        return new AuthorizationChangedEvent(Set.of(userId), ChangeType.SESSION_INVALIDATION);
    }

    public static AuthorizationChangedEvent revokeSessionsOf(Set<Long> userIds) {
        return new AuthorizationChangedEvent(userIds, ChangeType.SESSION_INVALIDATION);
    }
}
