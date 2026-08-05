package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.NotificationSummaryDTO;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.system.dto.NotificationPageQuery;
import com.nova.admin.modules.system.dto.NotificationRecipientPageQuery;
import com.nova.admin.modules.system.dto.NotificationRecipientRecordDTO;
import com.nova.admin.modules.system.dto.NotificationRecordSummaryDTO;

import java.util.Collection;

/** 站内消息服务。 */
public interface NotificationService {

    /** 查询当前用户的未读数量和最近消息。 */
    NotificationSummaryDTO getSummary(Long userId);

    /** 标记当前用户的一条消息为已读。 */
    void markRead(Long userId, Long messageId);

    /** 标记当前用户的全部消息为已读。 */
    int markAllRead(Long userId);

    PageResult<NotificationRecordSummaryDTO> getRecordPage(NotificationPageQuery query);

    NotificationRecordSummaryDTO getRecord(Long messageId);

    PageResult<NotificationRecipientRecordDTO> getRecipientPage(NotificationRecipientPageQuery query);

    /** 创建消息并投递给指定用户，供后续业务事件调用。 */
    default void publish(String type, String title, String content, String link, Collection<Long> userIds) {
        publish(type, title, content, link, null, userIds);
    }

    void publish(String type, String title, String content, String link, Long publisherId,
                 Collection<Long> userIds);
}
