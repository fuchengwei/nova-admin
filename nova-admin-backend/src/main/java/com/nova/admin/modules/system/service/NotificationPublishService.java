package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.NotificationPublishRequest;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewRequest;
import com.nova.admin.modules.system.dto.NotificationRecipientOptionsDTO;

/** 管理员站内消息发布服务。 */
public interface NotificationPublishService {

    NotificationRecipientOptionsDTO getRecipientOptions();

    NotificationRecipientPreviewDTO previewRecipients(NotificationRecipientPreviewRequest request);

    default int publish(NotificationPublishRequest request) {
        return publish(request, null);
    }

    int publish(NotificationPublishRequest request, Long publisherId);
}
