package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.NotificationRecordDTO;
import com.nova.admin.modules.system.dto.NotificationSummaryDTO;
import com.nova.admin.modules.system.entity.SysMessage;
import com.nova.admin.modules.system.mapper.SysMessageMapper;
import com.nova.admin.modules.system.mapper.SysMessageRecipientMapper;
import com.nova.admin.modules.system.event.NotificationCreatedEvent;
import com.nova.admin.modules.system.service.impl.NotificationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private SysMessageMapper messageMapper;

    @Mock
    private SysMessageRecipientMapper recipientMapper;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private NotificationServiceImpl service;

    @Test
    void getSummary_returnsUnreadCountAndRecentRecords() {
        NotificationRecordDTO record = new NotificationRecordDTO();
        record.setId(10L);
        record.setTitle("系统维护通知");
        record.setRead(false);
        given(messageMapper.countUnreadByUserId(7L)).willReturn(3L);
        given(messageMapper.selectRecentByUserId(7L, 10)).willReturn(List.of(record));

        NotificationSummaryDTO result = service.getSummary(7L);

        assertThat(result.getUnreadCount()).isEqualTo(3L);
        assertThat(result.getRecords()).containsExactly(record);
    }

    @Test
    void markRead_scopesUpdateToCurrentUserMessage() {
        service.markRead(7L, 10L);

        verify(recipientMapper).markRead(eq(10L), eq(7L), any());
    }

    @Test
    void markAllRead_returnsUpdatedCount() {
        given(recipientMapper.markAllRead(eq(7L), any())).willReturn(4);

        int result = service.markAllRead(7L);

        assertThat(result).isEqualTo(4);
        verify(recipientMapper).markAllRead(eq(7L), any());
    }

    @Test
    void publish_deduplicatesRecipientsAndSkipsNullUserIds() {
        doAnswer(invocation -> {
            SysMessage message = invocation.getArgument(0);
            message.setId(100L);
            return 1;
        }).when(messageMapper).insert(any(SysMessage.class));

        service.publish("system", "标题", "内容", null, Arrays.asList(7L, 7L, null, 8L));

        ArgumentCaptor<com.nova.admin.modules.system.entity.SysMessageRecipient> captor =
                ArgumentCaptor.forClass(com.nova.admin.modules.system.entity.SysMessageRecipient.class);
        verify(recipientMapper, org.mockito.Mockito.times(2)).insert(captor.capture());
        assertThat(captor.getAllValues()).extracting("userId").containsExactlyInAnyOrder(7L, 8L);

        ArgumentCaptor<NotificationCreatedEvent> eventCaptor =
                ArgumentCaptor.forClass(NotificationCreatedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().messageId()).isEqualTo(100L);
        assertThat(eventCaptor.getValue().userIds()).containsExactlyInAnyOrder(7L, 8L);
    }
}
