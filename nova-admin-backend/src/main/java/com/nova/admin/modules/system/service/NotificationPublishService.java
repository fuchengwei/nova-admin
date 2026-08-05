package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.NotificationPublishRequest;
import com.nova.admin.modules.system.dto.NotificationRecipientOptionsDTO;

/** 管理员站内消息发布服务。 */
public interface NotificationPublishService {

    NotificationRecipientOptionsDTO getRecipientOptions();

    int publish(NotificationPublishRequest request);
}
