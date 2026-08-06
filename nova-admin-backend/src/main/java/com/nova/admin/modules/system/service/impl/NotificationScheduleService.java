package com.nova.admin.modules.system.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.nova.admin.modules.system.entity.SysMessage;
import com.nova.admin.modules.system.enums.NotificationRecipientType;
import com.nova.admin.modules.system.enums.NotificationStatus;
import com.nova.admin.modules.system.mapper.SysMessageMapper;
import com.nova.admin.modules.system.service.NotificationPublishService;
import com.nova.admin.modules.system.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

/** 轮询并投递到期的定时消息。 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduleService {

    private final SysMessageMapper messageMapper;
    private final NotificationPublishService publishService;
    private final NotificationService notificationService;
    private final JsonMapper jsonMapper = JsonMapper.builder().build();

    @Scheduled(fixedDelay = 5000)
    public void dispatchDueMessages() {
        List<SysMessage> dueMessages;
        try {
            dueMessages = messageMapper.selectDueScheduled(LocalDateTime.now());
        } catch (Exception ex) {
            log.debug("消息表尚未就绪，跳过本轮定时消息扫描", ex);
            return;
        }
        for (SysMessage message : dueMessages) {
            if (messageMapper.claimScheduled(message.getId(), LocalDateTime.now()) != 1) {
                continue;
            }
            try {
                Collection<Long> recipientIds = jsonMapper.readValue(
                        message.getRecipientIds() == null ? "[]" : message.getRecipientIds(),
                        new TypeReference<List<Long>>() { });
                Collection<Long> userIds = publishService.resolveRecipients(
                        NotificationRecipientType.valueOf(message.getRecipientType()), recipientIds);
                if (userIds.isEmpty()) {
                    messageMapper.updateStatus(message.getId(), NotificationStatus.FAILED.name(),
                            "没有可接收消息的启用用户");
                    continue;
                }
                notificationService.deliver(message, userIds);
            } catch (Exception ex) {
                log.warn("定时消息发送失败: messageId={}", message.getId(), ex);
                messageMapper.updateStatus(message.getId(), NotificationStatus.FAILED.name(),
                        ex.getMessage() == null ? "定时消息发送失败" : ex.getMessage());
            }
        }
    }
}
