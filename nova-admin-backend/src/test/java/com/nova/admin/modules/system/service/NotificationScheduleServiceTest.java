package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.entity.SysMessage;
import com.nova.admin.modules.system.mapper.SysMessageMapper;
import com.nova.admin.modules.system.service.impl.NotificationScheduleService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationScheduleServiceTest {

    @Mock
    private SysMessageMapper messageMapper;
    @Mock
    private NotificationPublishService publishService;
    @Mock
    private NotificationService notificationService;

    @Test
    void dispatchDueMessages_reclaimsAndDeliversWithCurrentRecipients() {
        SysMessage message = scheduledMessage();
        when(messageMapper.selectDueScheduled(any())).thenReturn(List.of(message));
        when(messageMapper.claimScheduled(eq(9L), any())).thenReturn(1);
        when(publishService.resolveRecipients(eq(com.nova.admin.modules.system.enums.NotificationRecipientType.ALL), any()))
                .thenReturn(Set.of(3L, 4L));

        new NotificationScheduleService(messageMapper, publishService, notificationService).dispatchDueMessages();

        verify(notificationService).deliver(message, Set.of(3L, 4L));
        verify(messageMapper).claimScheduled(eq(9L), any());
    }

    @Test
    void dispatchDueMessages_marksFailureWhenNoEnabledRecipientRemains() {
        SysMessage message = scheduledMessage();
        when(messageMapper.selectDueScheduled(any())).thenReturn(List.of(message));
        when(messageMapper.claimScheduled(eq(9L), any())).thenReturn(1);
        when(publishService.resolveRecipients(any(), any())).thenReturn(Set.of());

        new NotificationScheduleService(messageMapper, publishService, notificationService).dispatchDueMessages();

        verify(messageMapper).updateStatus(9L, "FAILED", "没有可接收消息的启用用户");
        verifyNoInteractions(notificationService);
    }

    private SysMessage scheduledMessage() {
        SysMessage message = new SysMessage();
        message.setId(9L);
        message.setRecipientType("ALL");
        message.setRecipientIds("[]");
        message.setScheduledAt(LocalDateTime.now().minusMinutes(1));
        return message;
    }
}
