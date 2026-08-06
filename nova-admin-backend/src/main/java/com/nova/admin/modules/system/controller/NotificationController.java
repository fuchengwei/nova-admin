package com.nova.admin.modules.system.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.system.dto.NotificationSummaryDTO;
import com.nova.admin.modules.system.dto.NotificationPublishRequest;
import com.nova.admin.modules.system.dto.NotificationPublishResultDTO;
import com.nova.admin.modules.system.dto.NotificationDraftDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientOptionsDTO;
import com.nova.admin.modules.system.dto.NotificationPageQuery;
import com.nova.admin.modules.system.dto.NotificationRecipientPageQuery;
import com.nova.admin.modules.system.dto.NotificationRecipientRecordDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewDTO;
import com.nova.admin.modules.system.dto.NotificationRecipientPreviewRequest;
import com.nova.admin.modules.system.dto.NotificationRecordSummaryDTO;
import com.nova.admin.modules.system.service.NotificationPublishService;
import com.nova.admin.modules.system.service.NotificationService;
import com.nova.admin.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 当前用户的站内消息接口。 */
@Tag(name = "站内消息")
@RestController
@RequestMapping("/system/notification")
@RequiredArgsConstructor
public class NotificationController extends BaseController {

    private final NotificationService notificationService;
    private final NotificationPublishService notificationPublishService;

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

    @GetMapping("/recipients")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:notification:publish')")
    @Operation(summary = "获取站内消息接收对象")
    public R<NotificationRecipientOptionsDTO> getRecipientOptions() {
        return ok(notificationPublishService.getRecipientOptions());
    }

    @PostMapping("/recipients/preview")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:notification:publish')")
    @Operation(summary = "预览站内消息接收人")
    public R<NotificationRecipientPreviewDTO> previewRecipients(
            @Valid @RequestBody NotificationRecipientPreviewRequest request) {
        return ok(notificationPublishService.previewRecipients(request));
    }

    @PostMapping("/publish")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:notification:publish')")
    @Operation(summary = "发布站内消息")
    public R<NotificationPublishResultDTO> publish(
            @Valid @RequestBody NotificationPublishRequest request) {
        return ok(notificationPublishService.submit(request, SecurityUtils.requireUserId()));
    }

    @GetMapping("/{id}/draft")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:notification:publish')")
    @Operation(summary = "获取可编辑消息草稿")
    public R<NotificationDraftDTO> draft(
            @Parameter(description = "草稿 ID", required = true) @PathVariable Long id) {
        return ok(notificationPublishService.getDraft(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:notification:publish')")
    @Operation(summary = "更新消息草稿")
    public R<NotificationPublishResultDTO> updateDraft(
            @Parameter(description = "草稿 ID", required = true) @PathVariable Long id,
            @Valid @RequestBody NotificationPublishRequest request) {
        return ok(notificationPublishService.updateDraft(id, request, SecurityUtils.requireUserId()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:notification:publish')")
    @Operation(summary = "删除消息草稿")
    public R<Void> deleteDraft(
            @Parameter(description = "草稿 ID", required = true) @PathVariable Long id) {
        notificationPublishService.deleteDraft(id);
        return ok();
    }

    @GetMapping("/page")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:notification:publish')")
    @Operation(summary = "消息发布记录分页列表")
    public R<PageResult<NotificationRecordSummaryDTO>> page(NotificationPageQuery query) {
        return ok(notificationService.getRecordPage(query));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:notification:publish')")
    @Operation(summary = "消息发布记录详情")
    public R<NotificationRecordSummaryDTO> detail(
            @Parameter(description = "消息 ID", required = true) @PathVariable Long id) {
        return ok(notificationService.getRecord(id));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:notification:publish')")
    @Operation(summary = "取消待发送消息")
    public R<Void> cancel(
            @Parameter(description = "消息 ID", required = true) @PathVariable Long id) {
        notificationPublishService.cancel(id);
        return ok();
    }

    @GetMapping("/{id}/recipients")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('system:notification:publish')")
    @Operation(summary = "消息收件明细分页列表")
    public R<PageResult<NotificationRecipientRecordDTO>> recipients(
            @Parameter(description = "消息 ID", required = true) @PathVariable Long id,
            NotificationRecipientPageQuery query) {
        query.setMessageId(id);
        return ok(notificationService.getRecipientPage(query));
    }
}
