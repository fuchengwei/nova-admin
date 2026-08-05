package com.nova.admin.modules.system.service.impl;

import com.nova.admin.modules.system.dto.NotificationSummaryDTO;
import com.nova.admin.modules.system.entity.SysMessage;
import com.nova.admin.modules.system.entity.SysMessageRecipient;
import com.nova.admin.modules.system.mapper.SysMessageMapper;
import com.nova.admin.modules.system.mapper.SysMessageRecipientMapper;
import com.nova.admin.modules.system.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;

/** 站内消息服务实现。 */
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final int SUMMARY_LIMIT = 10;

    private final SysMessageMapper messageMapper;
    private final SysMessageRecipientMapper recipientMapper;

    @Override
    @Transactional(readOnly = true)
    public NotificationSummaryDTO getSummary(Long userId) {
        NotificationSummaryDTO summary = new NotificationSummaryDTO();
        summary.setUnreadCount(messageMapper.countUnreadByUserId(userId));
        summary.setRecords(messageMapper.selectRecentByUserId(userId, SUMMARY_LIMIT));
        return summary;
    }

    @Override
    @Transactional
    public void markRead(Long userId, Long messageId) {
        recipientMapper.markRead(messageId, userId, LocalDateTime.now());
    }

    @Override
    @Transactional
    public int markAllRead(Long userId) {
        return recipientMapper.markAllRead(userId, LocalDateTime.now());
    }

    @Override
    @Transactional
    public void publish(String type, String title, String content, String link, Collection<Long> userIds) {
        if (!StringUtils.hasText(type) || !StringUtils.hasText(title)
                || !StringUtils.hasText(content) || userIds == null || userIds.isEmpty()) {
            return;
        }

        SysMessage message = new SysMessage();
        message.setType(type.trim());
        message.setTitle(title.trim());
        message.setContent(content);
        message.setLink(StringUtils.hasText(link) ? link.trim() : null);
        message.setCreateTime(LocalDateTime.now());
        message.setDeleted(0);
        messageMapper.insert(message);

        LocalDateTime now = LocalDateTime.now();
        for (Long userId : new LinkedHashSet<>(userIds)) {
            if (userId == null) {
                continue;
            }
            SysMessageRecipient recipient = new SysMessageRecipient();
            recipient.setMessageId(message.getId());
            recipient.setUserId(userId);
            recipient.setCreateTime(now);
            recipientMapper.insert(recipient);
        }
    }
}
