package com.nova.admin.modules.job.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import com.nova.admin.modules.job.dto.JobPageQuery;
import com.nova.admin.modules.job.entity.SysJob;
import com.nova.admin.modules.job.mapper.SysJobMapper;
import com.nova.admin.modules.job.scheduler.JobScheduler;
import com.nova.admin.modules.job.service.JobService;
import com.nova.admin.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class JobServiceImpl implements JobService, ApplicationRunner {

    private final SysJobMapper jobMapper;
    private final JobScheduler jobScheduler;

    @Override
    public PageResult<SysJob> getJobPage(JobPageQuery query) {
        LambdaQueryWrapper<SysJob> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(query.getJobName()), SysJob::getJobName, query.getJobName())
                .eq(query.getStatus() != null, SysJob::getStatus, query.getStatus())
                .eq(StringUtils.hasText(query.getJobGroup()), SysJob::getJobGroup, query.getJobGroup())
                .orderByDesc(SysJob::getId);
        IPage<SysJob> page = jobMapper.selectPage(
                new Page<>(query.getCurrent(), query.getSize()), wrapper);
        return PageResult.of(page);
    }

    @Override
    public SysJob getById(Long id) {
        return jobMapper.selectById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long create(SysJob job) {
        applyDefaults(job);
        job.setCreateBy(SecurityUtils.requireUserId());
        jobMapper.insert(job);
        if (job.getStatus() == 1) {
            jobScheduler.schedule(job);
        }
        return job.getId();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void update(SysJob job) {
        if (job.getId() == null) {
            throw new BizException(ResultCode.BAD_REQUEST, "任务 ID 不能为空");
        }
        if (jobMapper.selectById(job.getId()) == null) {
            throw new BizException(ResultCode.DATA_NOT_FOUND, "定时任务不存在");
        }
        applyDefaults(job);
        job.setUpdateBy(SecurityUtils.requireUserId());
        jobMapper.updateById(job);
        if (job.getStatus() == 1) {
            jobScheduler.schedule(job);
        } else {
            jobScheduler.cancel(job.getId());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        jobScheduler.cancel(id);
        jobMapper.deleteById(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void pause(Long id) {
        SysJob job = jobMapper.selectById(id);
        if (job == null) {
            return;
        }
        job.setStatus(0);
        job.setUpdateBy(SecurityUtils.requireUserId());
        jobMapper.updateById(job);
        jobScheduler.cancel(id);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resume(Long id) {
        SysJob job = jobMapper.selectById(id);
        if (job == null) {
            return;
        }
        job.setStatus(1);
        job.setUpdateBy(SecurityUtils.requireUserId());
        jobMapper.updateById(job);
        jobScheduler.schedule(job);
    }

    @Override
    public void runOnce(Long id) {
        SysJob job = jobMapper.selectById(id);
        if (job == null) {
            return;
        }
        jobScheduler.runOnce(job);
    }

    private void applyDefaults(SysJob job) {
        if (!StringUtils.hasText(job.getJobGroup())) {
            job.setJobGroup("DEFAULT");
        }
        if (job.getStatus() == null) {
            job.setStatus(0);
        }
        if (job.getConcurrent() == null) {
            job.setConcurrent(1);
        }
        if (!StringUtils.hasText(job.getMisfirePolicy())) {
            job.setMisfirePolicy("DO_NOTHING");
        }
        JobScheduler.validateCron(job.getCronExpression());
    }

    /** 应用启动时加载所有运行中的任务 */
    @Override
    public void run(@NonNull ApplicationArguments args) {
        jobMapper.selectList(new LambdaQueryWrapper<SysJob>().eq(SysJob::getStatus, 1))
                .forEach(jobScheduler::schedule);
        log.info("定时任务调度器初始化完成");
    }
}
