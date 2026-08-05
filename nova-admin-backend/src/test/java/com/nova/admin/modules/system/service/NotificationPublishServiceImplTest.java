package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.NotificationPublishRequest;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
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

    private NotificationPublishRequest request(NotificationRecipientType recipientType) {
        NotificationPublishRequest request = new NotificationPublishRequest();
        request.setRecipientType(recipientType);
        request.setTitle("维护通知");
        request.setContent("系统将在今晚维护");
        return request;
    }
}
