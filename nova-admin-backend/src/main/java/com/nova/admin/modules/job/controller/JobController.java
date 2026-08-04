package com.nova.admin.modules.job.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.job.dto.JobLogPageQuery;
import com.nova.admin.modules.job.dto.JobPageQuery;
import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.entity.SysJobLog;
import com.nova.admin.modules.job.service.JobLogService;
import com.nova.admin.modules.job.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/monitor/job")
@RequiredArgsConstructor
@Validated
@Tag(name = "定时任务")
public class JobController extends BaseController {

    private final JobService jobService;
    private final JobLogService jobLogService;

    @GetMapping("/page")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('monitor:job:list')")
    @Operation(summary = "定时任务分页列表")
    public R<com.nova.admin.common.api.PageResult<SysJob>> page(JobPageQuery query) {
        return ok(jobService.getJobPage(query));
    }

    @GetMapping("/log/page")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('monitor:job:list')")
    @Operation(summary = "定时任务执行历史分页列表")
    public R<com.nova.admin.common.api.PageResult<SysJobLog>> logPage(JobLogPageQuery query) {
        return ok(jobLogService.getJobLogPage(query));
    }

    @GetMapping("/log/{id}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('monitor:job:list')")
    @Operation(summary = "定时任务执行历史详情")
    public R<SysJobLog> logDetail(
            @Parameter(description = "执行记录ID", required = true) @PathVariable Long id) {
        return ok(jobLogService.getById(id));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('monitor:job:list')")
    @Operation(summary = "定时任务详情")
    public R<SysJob> detail(@Parameter(description = "任务ID", required = true) @PathVariable Long id) {
        return ok(jobService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('super_admin') or hasAuthority('monitor:job:add')")
    @Operation(summary = "创建定时任务")
    public R<String> create(@Valid @RequestBody SysJob job) {
        return ok(String.valueOf(jobService.create(job)));
    }

    @PutMapping
    @PreAuthorize("hasRole('super_admin') or hasAuthority('monitor:job:edit')")
    @Operation(summary = "更新定时任务")
    public R<Void> update(@Valid @RequestBody SysJob job) {
        jobService.update(job);
        return ok();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('monitor:job:remove')")
    @Operation(summary = "删除定时任务")
    public R<Void> delete(@PathVariable Long id) {
        jobService.delete(id);
        return ok();
    }

    @PutMapping("/pause/{id}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('monitor:job:pause')")
    @Operation(summary = "暂停定时任务")
    public R<Void> pause(@PathVariable Long id) {
        jobService.pause(id);
        return ok();
    }

    @PutMapping("/resume/{id}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('monitor:job:resume')")
    @Operation(summary = "恢复定时任务")
    public R<Void> resume(@PathVariable Long id) {
        jobService.resume(id);
        return ok();
    }

    @PutMapping("/run/{id}")
    @PreAuthorize("hasRole('super_admin') or hasAuthority('monitor:job:run')")
    @Operation(summary = "执行一次定时任务")
    public R<Void> run(@PathVariable Long id) {
        jobService.runOnce(id);
        return ok();
    }
}
