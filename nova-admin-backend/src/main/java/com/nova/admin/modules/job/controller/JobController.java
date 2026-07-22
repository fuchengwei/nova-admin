package com.nova.admin.modules.job.controller;

import com.nova.admin.common.api.R;
import com.nova.admin.common.base.BaseController;
import com.nova.admin.modules.job.dto.JobPageQuery;
import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.service.JobService;
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
public class JobController extends BaseController {

    private final JobService jobService;

    @GetMapping("/page")
    @PreAuthorize("hasAuthority('monitor:job:list')")
    public R<com.nova.admin.common.api.PageResult<SysJob>> page(JobPageQuery query) {
        return ok(jobService.getJobPage(query));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('monitor:job:list')")
    public R<SysJob> detail(@PathVariable Long id) {
        return ok(jobService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('monitor:job:add')")
    public R<Long> create(@Valid @RequestBody SysJob job) {
        return ok(jobService.create(job));
    }

    @PutMapping
    @PreAuthorize("hasAuthority('monitor:job:edit')")
    public R<Void> update(@Valid @RequestBody SysJob job) {
        jobService.update(job);
        return ok();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('monitor:job:remove')")
    public R<Void> delete(@PathVariable Long id) {
        jobService.delete(id);
        return ok();
    }

    @PutMapping("/pause/{id}")
    @PreAuthorize("hasAuthority('monitor:job:pause')")
    public R<Void> pause(@PathVariable Long id) {
        jobService.pause(id);
        return ok();
    }

    @PutMapping("/resume/{id}")
    @PreAuthorize("hasAuthority('monitor:job:resume')")
    public R<Void> resume(@PathVariable Long id) {
        jobService.resume(id);
        return ok();
    }

    @PutMapping("/run/{id}")
    @PreAuthorize("hasAuthority('monitor:job:run')")
    public R<Void> run(@PathVariable Long id) {
        jobService.runOnce(id);
        return ok();
    }
}
