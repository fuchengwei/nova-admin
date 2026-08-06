package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.nova.admin.modules.system.dto.NotificationDraftDTO;
import com.nova.admin.modules.system.dto.NotificationPageQuery;
import com.nova.admin.modules.system.dto.NotificationRecipientPageQuery;
import com.nova.admin.modules.system.dto.NotificationRecipientRecordDTO;
import com.nova.admin.modules.system.dto.NotificationRecordSummaryDTO;
import com.nova.admin.modules.system.dto.NotificationSummaryDTO;
import com.nova.admin.modules.system.enums.NotificationRecipientType;
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
import java.util.List;

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

        SysMessage message = createPending(type, title, content, link, publisherId, "SENT", null, null, null);
        deliver(message, userIds);
    }

    @Override
    @Transactional
    public SysMessage createPending(String type, String title, String content, String link, Long publisherId,
                                    String status, LocalDateTime scheduledAt, String recipientType,
                                    String recipientIds) {
        SysMessage message = new SysMessage();
        message.setType(type.trim());
        message.setTitle(title.trim());
        message.setContent(content);
        message.setLink(StringUtils.hasText(link) ? link.trim() : null);
        message.setPublisherId(publisherId);
        message.setStatus(status);
        message.setScheduledAt(scheduledAt);
        message.setRecipientType(recipientType);
        message.setRecipientIds(recipientIds);
        message.setCreateTime(LocalDateTime.now());
        message.setDeleted(0);
        messageMapper.insert(message);
        return message;
    }

    @Override
    @Transactional
    public void deliver(SysMessage message, Collection<Long> userIds) {
        if (message == null || userIds == null || userIds.isEmpty()) {
            return;
        }

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
            messageMapper.updateStatus(message.getId(), "SENT", null);
            eventPublisher.publishEvent(new NotificationCreatedEvent(message.getId(), recipientUserIds));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationDraftDTO getDraft(Long messageId) {
        SysMessage message = messageMapper.selectDraftById(messageId);
        if (message == null) {
            throw new BizException(ResultCode.NOT_FOUND, "草稿不存在或已不可编辑");
        }
        NotificationDraftDTO draft = new NotificationDraftDTO();
        draft.setId(message.getId());
        draft.setTitle(message.getTitle());
        draft.setContent(message.getContent());
        draft.setLink(message.getLink());
        try {
            if (!StringUtils.hasText(message.getRecipientType())) {
                throw new IllegalArgumentException("recipient type is empty");
            }
            draft.setRecipientType(NotificationRecipientType.valueOf(message.getRecipientType()));
            List<Long> recipientIds = message.getRecipientIds() == null
                    ? List.of()
                    : JsonMapper.builder().build().readValue(message.getRecipientIds(), new TypeReference<>() {});
            draft.setRecipientIds(recipientIds);
        } catch (Exception ex) {
            throw new BizException(ResultCode.BAD_REQUEST, "草稿接收范围数据损坏");
        }
        return draft;
    }

    @Override
    @Transactional
    public void updateDraft(Long messageId, String title, String content, String link, Long publisherId,
                            String status, LocalDateTime scheduledAt, String recipientType,
                            String recipientIds) {
        if (messageMapper.updateDraft(messageId, title, content, link, publisherId, status, scheduledAt,
                recipientType, recipientIds) == 0) {
            throw new BizException(ResultCode.BAD_REQUEST, "草稿不存在或已不可编辑");
        }
    }

    @Override
    @Transactional
    public void deleteDraft(Long messageId) {
        if (messageMapper.deleteDraft(messageId) == 0) {
            throw new BizException(ResultCode.BAD_REQUEST, "仅草稿可以删除");
        }
    }

    @Override
    @Transactional
    public void cancel(Long messageId) {
        if (messageMapper.cancel(messageId) == 0) {
            throw new BizException(ResultCode.BAD_REQUEST, "仅待发送消息可以取消");
        }
    }
}
