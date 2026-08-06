package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.nova.admin.modules.system.dto.NotificationDraftDTO;
import com.nova.admin.modules.system.dto.NotificationPublishRequest;
import com.nova.admin.modules.system.dto.NotificationPublishResultDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientOptionDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientOptionsDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewRequest;
import com.nova.admin.modules.system.entity.SysRole;
import com.nova.admin.modules.system.entity.SysMessage;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.enums.NotificationRecipientType;
import com.nova.admin.modules.system.enums.NotificationPublishMode;
import com.nova.admin.modules.system.enums.NotificationStatus;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.service.NotificationPublishService;
import com.nova.admin.modules.system.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/** 管理员手动发布站内消息。 */
@Service
@RequiredArgsConstructor
public class NotificationPublishServiceImpl implements NotificationPublishService {

    private static final int ENABLED = 1;
    private static final String MESSAGE_TYPE = "system";

    private final SysUserMapper userMapper;
    private final SysRoleMapper roleMapper;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public NotificationRecipientOptionsDTO getRecipientOptions() {
        NotificationRecipientOptionsDTO options = new NotificationRecipientOptionsDTO();
        options.setUsers(userMapper.selectList(new LambdaQueryWrapper<SysUser>()
                        .eq(SysUser::getStatus, ENABLED)
                        .orderByAsc(SysUser::getAccount))
                .stream()
                .map(user -> new NotificationRecipientOptionDTO(user.getId(), userLabel(user)))
                .toList());
        options.setRoles(roleMapper.selectList(new LambdaQueryWrapper<SysRole>()
                        .eq(SysRole::getStatus, ENABLED)
                        .orderByAsc(SysRole::getSort))
                .stream()
                .map(role -> new NotificationRecipientOptionDTO(role.getId(), role.getName() + " (" + role.getCode() + ")"))
                .toList());
        return options;
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationRecipientPreviewDTO previewRecipients(NotificationRecipientPreviewRequest request) {
        Set<Long> userIds = resolveRecipientUserIds(request.getRecipientType(), request.getRecipientIds());
        NotificationRecipientPreviewDTO preview = new NotificationRecipientPreviewDTO();
        preview.setRecipientCount(userIds.size());
        if (userIds.isEmpty()) {
            preview.setSamples(java.util.List.of());
            return preview;
        }
        preview.setSamples(userMapper.selectEnabledUsersByIds(userIds).stream()
                .map(user -> new NotificationRecipientOptionDTO(user.getId(), userLabel(user)))
                .toList());
        return preview;
    }

    @Override
    @Transactional
    public int publish(NotificationPublishRequest request, Long publisherId) {
        Set<Long> userIds = resolveRecipientUserIds(request.getRecipientType(), request.getRecipientIds());
        if (userIds.isEmpty()) {
            throw new BizException(ResultCode.BAD_REQUEST, "没有可接收消息的启用用户");
        }
        if (publisherId == null) {
            notificationService.publish(MESSAGE_TYPE, request.getTitle(), request.getContent(), request.getLink(),
                    userIds);
        } else {
            notificationService.publish(MESSAGE_TYPE, request.getTitle(), request.getContent(), request.getLink(),
                    publisherId, userIds);
        }
        return userIds.size();
    }

    @Override
    @Transactional
    public NotificationPublishResultDTO submit(NotificationPublishRequest request, Long publisherId) {
        NotificationPublishMode mode = request.getMode() == null
                ? NotificationPublishMode.IMMEDIATE : request.getMode();
        NotificationPublishResultDTO result = new NotificationPublishResultDTO();
        result.setStatus(mode.name());
        result.setScheduledAt(request.getScheduledAt());
        if (mode == NotificationPublishMode.IMMEDIATE) {
            int count = publish(request, publisherId);
            result.setStatus(NotificationStatus.SENT.name());
            result.setRecipientCount(count);
            return result;
        }
        validateRecipientSelection(request.getRecipientType(), request.getRecipientIds());
        if (mode == NotificationPublishMode.SCHEDULED
                && (request.getScheduledAt() == null || !request.getScheduledAt().isAfter(LocalDateTime.now()))) {
            throw new BizException(ResultCode.BAD_REQUEST, "计划发送时间必须晚于当前时间");
        }
        String recipientIds = serializeRecipientIds(request.getRecipientIds());
        SysMessage message = notificationService.createPending(
                MESSAGE_TYPE, request.getTitle(), request.getContent(), request.getLink(), publisherId,
                mode == NotificationPublishMode.DRAFT ? NotificationStatus.DRAFT.name() : NotificationStatus.SCHEDULED.name(),
                mode == NotificationPublishMode.SCHEDULED ? request.getScheduledAt() : null,
                request.getRecipientType().name(), recipientIds);
        result.setId(message.getId());
        result.setStatus(message.getStatus());
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationDraftDTO getDraft(Long messageId) {
        return notificationService.getDraft(messageId);
    }

    @Override
    @Transactional
    public NotificationPublishResultDTO updateDraft(Long messageId, NotificationPublishRequest request,
                                                    Long publisherId) {
        NotificationPublishMode mode = request.getMode() == null
                ? NotificationPublishMode.DRAFT : request.getMode();
        validateRecipientSelection(request.getRecipientType(), request.getRecipientIds());
        if (mode == NotificationPublishMode.SCHEDULED
                && (request.getScheduledAt() == null || !request.getScheduledAt().isAfter(LocalDateTime.now()))) {
            throw new BizException(ResultCode.BAD_REQUEST, "计划发送时间必须晚于当前时间");
        }

        Set<Long> userIds = mode == NotificationPublishMode.IMMEDIATE
                ? resolveRecipientUserIds(request.getRecipientType(), request.getRecipientIds())
                : Set.of();
        if (mode == NotificationPublishMode.IMMEDIATE && userIds.isEmpty()) {
            throw new BizException(ResultCode.BAD_REQUEST, "没有可接收消息的启用用户");
        }

        String recipientIds = serializeRecipientIds(request.getRecipientIds());
        String status = mode == NotificationPublishMode.IMMEDIATE
                ? NotificationStatus.SENDING.name() : mode == NotificationPublishMode.SCHEDULED
                        ? NotificationStatus.SCHEDULED.name() : NotificationStatus.DRAFT.name();
        notificationService.updateDraft(messageId, request.getTitle(), request.getContent(), request.getLink(),
                publisherId, status, mode == NotificationPublishMode.SCHEDULED ? request.getScheduledAt() : null,
                request.getRecipientType().name(), recipientIds);

        NotificationPublishResultDTO result = new NotificationPublishResultDTO();
        result.setId(messageId);
        if (mode == NotificationPublishMode.IMMEDIATE) {
            SysMessage message = new SysMessage();
            message.setId(messageId);
            notificationService.deliver(message, userIds);
            result.setStatus(NotificationStatus.SENT.name());
            result.setRecipientCount(userIds.size());
        } else {
            result.setStatus(status);
            result.setScheduledAt(request.getScheduledAt());
        }
        return result;
    }

    @Override
    @Transactional
    public void deleteDraft(Long messageId) {
        notificationService.deleteDraft(messageId);
    }

    @Override
    public Set<Long> resolveRecipients(NotificationRecipientType recipientType, Collection<Long> recipientIds) {
        return resolveRecipientUserIds(recipientType, recipientIds);
    }

    @Override
    @Transactional
    public void cancel(Long messageId) {
        notificationService.cancel(messageId);
    }

    private Set<Long> resolveRecipientUserIds(NotificationRecipientType recipientType, Collection<Long> recipientIds) {
        if (recipientType == null) {
            throw new BizException(ResultCode.BAD_REQUEST, "请选择接收范围");
        }
        if (recipientType == NotificationRecipientType.ALL) {
            return new LinkedHashSet<>(userMapper.selectEnabledUserIds());
        }
        if (recipientIds == null || recipientIds.isEmpty()) {
            throw new BizException(ResultCode.BAD_REQUEST, "请选择接收对象");
        }
        Set<Long> selectedIds = recipientIds.stream().filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (selectedIds.isEmpty()) {
            throw new BizException(ResultCode.BAD_REQUEST, "请选择接收对象");
        }
        if (recipientType == NotificationRecipientType.USER) {
            return new LinkedHashSet<>(userMapper.selectEnabledUserIdsByIds(selectedIds));
        }
        return new LinkedHashSet<>(userMapper.selectEnabledUserIdsByRoleIds(selectedIds));
    }

    private void validateRecipientSelection(NotificationRecipientType recipientType, Collection<Long> recipientIds) {
        if (recipientType == null) {
            throw new BizException(ResultCode.BAD_REQUEST, "请选择接收范围");
        }
        if (recipientType != NotificationRecipientType.ALL && (recipientIds == null || recipientIds.isEmpty())) {
            throw new BizException(ResultCode.BAD_REQUEST, "请选择接收对象");
        }
    }

    private String serializeRecipientIds(Collection<Long> recipientIds) {
        try {
            return JsonMapper.builder().build().writeValueAsString(
                    recipientIds == null ? java.util.List.of() : recipientIds);
        } catch (Exception ex) {
            throw new BizException(ResultCode.BAD_REQUEST, "接收对象保存失败");
        }
    }

    private String userLabel(SysUser user) {
        return StringUtils.hasText(user.getNickname())
                ? user.getNickname() + " (" + user.getAccount() + ")"
                : user.getAccount();
    }
}
