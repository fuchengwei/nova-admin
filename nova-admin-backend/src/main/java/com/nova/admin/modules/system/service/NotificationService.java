package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.NotificationSummaryDTO;

import java.util.Collection;

/** 站内消息服务。 */
public interface NotificationService {

    /** 查询当前用户的未读数量和最近消息。 */
    NotificationSummaryDTO getSummary(Long userId);

    /** 标记当前用户的一条消息为已读。 */
    void markRead(Long userId, Long messageId);

    /** 标记当前用户的全部消息为已读。 */
    int markAllRead(Long userId);

    /** 创建消息并投递给指定用户，供后续业务事件调用。 */
    void publish(String type, String title, String content, String link, Collection<Long> userIds);
}
