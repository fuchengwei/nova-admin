package com.nova.admin.modules.system.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.system.dto.NotificationPublishRequest;
import com.nova.admin.modules.system.dto.NotificationRecipientOptionDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientOptionsDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewRequest;
import com.nova.admin.modules.system.entity.SysRole;
import com.nova.admin.modules.system.entity.SysUser;
import com.nova.admin.modules.system.enums.NotificationRecipientType;
import com.nova.admin.modules.system.mapper.SysRoleMapper;
import com.nova.admin.modules.system.mapper.SysUserMapper;
import com.nova.admin.modules.system.service.NotificationPublishService;
import com.nova.admin.modules.system.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

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

    private String userLabel(SysUser user) {
        return StringUtils.hasText(user.getNickname())
                ? user.getNickname() + " (" + user.getAccount() + ")"
                : user.getAccount();
    }
}
