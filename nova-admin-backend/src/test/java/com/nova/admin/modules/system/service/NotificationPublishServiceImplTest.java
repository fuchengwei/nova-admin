package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.NotificationPublishRequest;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewRequest;
import com.nova.admin.modules.system.dto.NotificationPublishResultDTO;
import com.nova.admin.modules.system.enums.NotificationRecipientType;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.service.impl.NotificationPublishServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collection;
import java.util.List;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationPublishServiceImplTest {

    @Mock
    private SysUserMapper userMapper;

    @Mock
    private SysRoleMapper roleMapper;

    @Mock
    private NotificationService notificationService;

    @Test
    void publish_whenAllEnabledUsersSelected_publishesToEveryEnabledUser() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        when(userMapper.selectEnabledUserIds()).thenReturn(List.of(1L, 2L));
        NotificationPublishRequest request = new NotificationPublishRequest();
        request.setRecipientType(NotificationRecipientType.ALL);
        request.setTitle("维护通知");
        request.setContent("系统将在今晚维护");
        request.setLink("/system/settings");

        int recipients = service.publish(request);

        ArgumentCaptor<Collection<Long>> recipientCaptor = ArgumentCaptor.forClass(Collection.class);
        verify(notificationService).publish(
                eq("system"), eq("维护通知"), eq("系统将在今晚维护"), eq("/system/settings"),
                recipientCaptor.capture());
        assertThat(recipients).isEqualTo(2);
        assertThat(recipientCaptor.getValue()).containsExactly(1L, 2L);
    }

    @Test
    void publish_whenSelectedUsersIncludeDisabledUsers_publishesOnlyEnabledUsers() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        when(userMapper.selectEnabledUserIdsByIds(any())).thenReturn(List.of(2L));
        NotificationPublishRequest request = request(NotificationRecipientType.USER);
        request.setRecipientIds(List.of(1L, 2L));

        int recipients = service.publish(request);

        ArgumentCaptor<Collection<Long>> recipientCaptor = ArgumentCaptor.forClass(Collection.class);
        verify(notificationService).publish(eq("system"), eq("维护通知"), eq("系统将在今晚维护"), eq(null),
                recipientCaptor.capture());
        assertThat(recipientCaptor.getValue()).containsExactly(2L);
        assertThat(recipients).isEqualTo(1);
    }

    @Test
    void publish_whenSelectedRolesHaveEnabledUsers_publishesDistinctUsers() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        when(userMapper.selectEnabledUserIdsByRoleIds(any())).thenReturn(List.of(2L, 3L));
        NotificationPublishRequest request = request(NotificationRecipientType.ROLE);
        request.setRecipientIds(List.of(10L, 11L));

        int recipients = service.publish(request);

        ArgumentCaptor<Collection<Long>> recipientCaptor = ArgumentCaptor.forClass(Collection.class);
        verify(notificationService).publish(eq("system"), eq("维护通知"), eq("系统将在今晚维护"), eq(null),
                recipientCaptor.capture());
        assertThat(recipientCaptor.getValue()).containsExactly(2L, 3L);
        assertThat(recipients).isEqualTo(2);
    }

    @Test
    void publish_whenNoEnabledUsersResolved_throwsBadRequest() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        when(userMapper.selectEnabledUserIds()).thenReturn(List.of());

        assertThatThrownBy(() -> service.publish(request(NotificationRecipientType.ALL)))
                .hasMessage("没有可接收消息的启用用户");
    }

    @Test
    void preview_whenSelectedUsersResolved_returnsCountAndSamples() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        when(userMapper.selectEnabledUserIdsByIds(any())).thenReturn(List.of(2L, 3L));
        com.nova.admin.modules.system.entity.SysUser first = new com.nova.admin.modules.system.entity.SysUser();
        first.setId(2L);
        first.setAccount("zhangsan");
        first.setNickname("张三");
        com.nova.admin.modules.system.entity.SysUser second = new com.nova.admin.modules.system.entity.SysUser();
        second.setId(3L);
        second.setAccount("lisi");
        when(userMapper.selectEnabledUsersByIds(any())).thenReturn(List.of(first, second));

        NotificationRecipientPreviewRequest request = new NotificationRecipientPreviewRequest();
        request.setRecipientType(NotificationRecipientType.USER);
        request.setRecipientIds(List.of(2L, 3L));

        NotificationRecipientPreviewDTO result = service.previewRecipients(request);

        assertThat(result.getRecipientCount()).isEqualTo(2);
        assertThat(result.getSamples()).extracting("label")
                .containsExactly("张三 (zhangsan)", "lisi");
    }

    @Test
    void preview_whenRoleHasNoEnabledUsers_returnsZeroWithoutSamples() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        when(userMapper.selectEnabledUserIdsByRoleIds(any())).thenReturn(List.of());

        NotificationRecipientPreviewRequest request = new NotificationRecipientPreviewRequest();
        request.setRecipientType(NotificationRecipientType.ROLE);
        request.setRecipientIds(List.of(10L));

        NotificationRecipientPreviewDTO result = service.previewRecipients(request);

        assertThat(result.getRecipientCount()).isZero();
        assertThat(result.getSamples()).isEmpty();
    }

    @Test
    void submit_whenDraftSelected_persistsPendingMessageWithoutSending() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        NotificationPublishRequest request = request(NotificationRecipientType.ALL);
        request.setMode(com.nova.admin.modules.system.enums.NotificationPublishMode.DRAFT);
        doAnswer(invocation -> {
            com.nova.admin.modules.system.entity.SysMessage message = new com.nova.admin.modules.system.entity.SysMessage();
            message.setId(88L);
            message.setStatus("DRAFT");
            return message;
        }).when(notificationService).createPending(any(), any(), any(), any(), any(), any(), any(), any(), any());

        NotificationPublishResultDTO result = service.submit(request, 1L);

        assertThat(result.getId()).isEqualTo(88L);
        assertThat(result.getStatus()).isEqualTo("DRAFT");
        verify(notificationService).createPending(eq("system"), eq("维护通知"), eq("系统将在今晚维护"),
                eq(null), eq(1L), eq("DRAFT"), eq(null), eq("ALL"), any());
    }

    @Test
    void updateDraft_whenStillDraft_updatesSameMessageWithoutDelivery() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        NotificationPublishRequest request = request(NotificationRecipientType.USER);
        request.setRecipientIds(List.of(2L));
        request.setMode(com.nova.admin.modules.system.enums.NotificationPublishMode.DRAFT);

        NotificationPublishResultDTO result = service.updateDraft(88L, request, 1L);

        assertThat(result.getId()).isEqualTo(88L);
        assertThat(result.getStatus()).isEqualTo("DRAFT");
        verify(notificationService).updateDraft(eq(88L), eq("维护通知"), eq("系统将在今晚维护"), eq(null),
                eq(1L), eq("DRAFT"), eq(null), eq("USER"), eq("[2]"));
    }

    @Test
    void updateDraft_whenScheduled_updatesSameMessageWithSchedule() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        NotificationPublishRequest request = request(NotificationRecipientType.ALL);
        LocalDateTime scheduledAt = LocalDateTime.now().plusHours(1);
        request.setMode(com.nova.admin.modules.system.enums.NotificationPublishMode.SCHEDULED);
        request.setScheduledAt(scheduledAt);

        NotificationPublishResultDTO result = service.updateDraft(88L, request, 1L);

        assertThat(result.getStatus()).isEqualTo("SCHEDULED");
        assertThat(result.getScheduledAt()).isEqualTo(scheduledAt);
        verify(notificationService).updateDraft(eq(88L), eq("维护通知"), eq("系统将在今晚维护"), eq(null),
                eq(1L), eq("SCHEDULED"), eq(scheduledAt), eq("ALL"), eq("[]"));
    }

    @Test
    void updateDraft_whenImmediateResolvesRecipientsAndDeliversSameMessage() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        when(userMapper.selectEnabledUserIdsByIds(any())).thenReturn(List.of(2L));
        NotificationPublishRequest request = request(NotificationRecipientType.USER);
        request.setRecipientIds(List.of(2L));
        request.setMode(com.nova.admin.modules.system.enums.NotificationPublishMode.IMMEDIATE);

        NotificationPublishResultDTO result = service.updateDraft(88L, request, 1L);

        assertThat(result.getStatus()).isEqualTo("SENT");
        assertThat(result.getRecipientCount()).isEqualTo(1);
        verify(notificationService).updateDraft(eq(88L), eq("维护通知"), eq("系统将在今晚维护"), eq(null),
                eq(1L), eq("SENDING"), eq(null), eq("USER"), eq("[2]"));
        ArgumentCaptor<Collection<Long>> recipientCaptor = ArgumentCaptor.forClass(Collection.class);
        verify(notificationService).deliver(any(com.nova.admin.modules.system.entity.SysMessage.class),
                recipientCaptor.capture());
        assertThat(recipientCaptor.getValue()).containsExactly(2L);
    }

    @Test
    void updateDraft_whenImmediateHasNoEnabledRecipients_rejectsBeforeUpdating() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        when(userMapper.selectEnabledUserIdsByIds(any())).thenReturn(List.of());
        NotificationPublishRequest request = request(NotificationRecipientType.USER);
        request.setRecipientIds(List.of(2L));
        request.setMode(com.nova.admin.modules.system.enums.NotificationPublishMode.IMMEDIATE);

        assertThatThrownBy(() -> service.updateDraft(88L, request, 1L))
                .hasMessage("没有可接收消息的启用用户");
        org.mockito.Mockito.verifyNoInteractions(notificationService);
    }

    @Test
    void updateDraft_whenScheduledTimeIsPast_rejectsBeforeUpdating() {
        NotificationPublishService service = new NotificationPublishServiceImpl(
                userMapper, roleMapper, notificationService);
        NotificationPublishRequest request = request(NotificationRecipientType.ALL);
        request.setMode(com.nova.admin.modules.system.enums.NotificationPublishMode.SCHEDULED);
        request.setScheduledAt(LocalDateTime.now().minusMinutes(1));

        assertThatThrownBy(() -> service.updateDraft(88L, request, 1L))
                .hasMessage("计划发送时间必须晚于当前时间");
        org.mockito.Mockito.verifyNoInteractions(notificationService);
    }

    private NotificationPublishRequest request(NotificationRecipientType recipientType) {
        NotificationPublishRequest request = new NotificationPublishRequest();
        request.setRecipientType(recipientType);
        request.setTitle("维护通知");
        request.setContent("系统将在今晚维护");
        return request;
    }
}
