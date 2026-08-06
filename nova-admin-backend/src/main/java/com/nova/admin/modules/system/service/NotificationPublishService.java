package com.nova.admin.modules.system.service;

import com.nova.admin.modules.system.dto.NotificationPublishRequest;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewRequest;
import com.nova.admin.modules.system.dto.NotificationRecipientOptionsDTO;
import com.nova.admin.modules.system.dto.NotificationPublishResultDTO;
import com.nova.admin.modules.system.dto.NotificationDraftDTO;
import com.nova.admin.modules.system.enums.NotificationRecipientType;

import java.util.Collection;
import java.util.Set;

/** 管理员站内消息发布服务。 */
public interface NotificationPublishService {

    NotificationRecipientOptionsDTO getRecipientOptions();

    NotificationRecipientPreviewDTO previewRecipients(NotificationRecipientPreviewRequest request);

    default int publish(NotificationPublishRequest request) {
        return publish(request, null);
    }

    int publish(NotificationPublishRequest request, Long publisherId);

    NotificationPublishResultDTO submit(NotificationPublishRequest request, Long publisherId);

    NotificationDraftDTO getDraft(Long messageId);

    NotificationPublishResultDTO updateDraft(Long messageId, NotificationPublishRequest request,
                                             Long publisherId);

    void deleteDraft(Long messageId);

    Set<Long> resolveRecipients(NotificationRecipientType recipientType,
                                Collection<Long> recipientIds);

    void cancel(Long messageId);
}
