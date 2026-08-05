package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.modules.system.dto.NotificationPageQuery;
import com.nova.admin.modules.system.dto.NotificationRecipientPageQuery;
import com.nova.admin.modules.system.dto.NotificationRecipientRecordDTO;
import com.nova.admin.modules.system.dto.NotificationRecordSummaryDTO;
import com.nova.admin.modules.system.dto.NotificationSummaryDTO;
import com.nova.admin.modules.system.entity.SysMessage;
import com.nova.admin.modules.system.entity.SysMessageRecipient;
import com.nova.admin.modules.system.event.NotificationCreatedEvent;
import com.nova.admin.modules.system.mapper.SysMessageMapper;
import com.nova.admin.modules.system.mapper.SysMessageRecipientMapper;
import com.nova.admin.modules.system.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
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
    private final ApplicationEventPublisher eventPublisher;

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
    @Transactional(readOnly = true)
    public PageResult<NotificationRecordSummaryDTO> getRecordPage(NotificationPageQuery query) {
        Page<NotificationRecordSummaryDTO> page = new Page<>(query.getCurrent(), query.getSize());
        return PageResult.of(messageMapper.selectRecordPage(page, query));
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationRecordSummaryDTO getRecord(Long messageId) {
        NotificationRecordSummaryDTO record = messageMapper.selectRecordById(messageId);
        if (record == null) {
            throw new BizException(ResultCode.NOT_FOUND, "消息记录不存在");
        }
        return record;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResult<NotificationRecipientRecordDTO> getRecipientPage(NotificationRecipientPageQuery query) {
        if (query.getMessageId() == null || messageMapper.selectRecordById(query.getMessageId()) == null) {
            throw new BizException(ResultCode.NOT_FOUND, "消息记录不存在");
        }
        Page<NotificationRecipientRecordDTO> page = new Page<>(query.getCurrent(), query.getSize());
        return PageResult.of(recipientMapper.selectRecipientPage(page, query));
    }

    @Override
    @Transactional
    public void publish(String type, String title, String content, String link, Long publisherId,
                        Collection<Long> userIds) {
        if (!StringUtils.hasText(type) || !StringUtils.hasText(title)
                || !StringUtils.hasText(content) || userIds == null || userIds.isEmpty()) {
            return;
        }

        SysMessage message = new SysMessage();
        message.setType(type.trim());
        message.setTitle(title.trim());
        message.setContent(content);
        message.setLink(StringUtils.hasText(link) ? link.trim() : null);
        message.setPublisherId(publisherId);
        message.setCreateTime(LocalDateTime.now());
        message.setDeleted(0);
        messageMapper.insert(message);

        LocalDateTime now = LocalDateTime.now();
        LinkedHashSet<Long> recipientUserIds = new LinkedHashSet<>();
        for (Long userId : userIds) {
            if (userId == null || !recipientUserIds.add(userId)) {
                continue;
            }
            SysMessageRecipient recipient = new SysMessageRecipient();
            recipient.setMessageId(message.getId());
            recipient.setUserId(userId);
            recipient.setCreateTime(now);
            recipientMapper.insert(recipient);
        }
        if (!recipientUserIds.isEmpty()) {
            eventPublisher.publishEvent(new NotificationCreatedEvent(message.getId(), recipientUserIds));
        }
    }
}
