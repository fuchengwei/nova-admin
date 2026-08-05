package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.NotificationPublishRequest;
import com.nova.admin.modules.system.dto.NotificationRecipientOptionsDTO;

/** 管理员站内消息发布服务。 */
public interface NotificationPublishService {

    NotificationRecipientOptionsDTO getRecipientOptions();

    default int publish(NotificationPublishRequest request) {
        return publish(request, null);
    }

    int publish(NotificationPublishRequest request, Long publisherId);
}
