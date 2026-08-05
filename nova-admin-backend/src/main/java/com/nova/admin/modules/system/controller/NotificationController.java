package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.system.dto.NotificationSummaryDTO;
import com.nova.admin.modules.system.service.NotificationService;
import com.nova.admin.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 当前用户的站内消息接口。 */
@Tag(name = "站内消息")
@RestController
@RequestMapping("/system/notification")
@RequiredArgsConstructor
public class NotificationController extends BaseController {

    private final NotificationService notificationService;

    @GetMapping("/summary")
    @Operation(summary = "获取当前用户站内消息摘要")
    public R<NotificationSummaryDTO> getSummary() {
        return ok(notificationService.getSummary(SecurityUtils.requireUserId()));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "标记站内消息已读")
    public R<Void> markRead(
            @Parameter(description = "消息 ID", required = true)
            @PathVariable Long id) {
        notificationService.markRead(SecurityUtils.requireUserId(), id);
        return ok();
    }

    @PutMapping("/read-all")
    @Operation(summary = "标记全部站内消息已读")
    public R<Integer> markAllRead() {
        return ok(notificationService.markAllRead(SecurityUtils.requireUserId()));
    }
}
