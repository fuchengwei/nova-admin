package com.nova.admin.modules.job.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.nova.admin.common.api.PageResult;
import com.nova.admin.modules.job.dto.JobPageQuery;
import com.nova.admin.modules.job.entity.SysJob;

public interface JobService {

    PageResult<SysJob> getJobPage(JobPageQuery query);

    SysJob getById(Long id);

    Long create(SysJob job);

    void update(SysJob job);

    void delete(Long id);

    /** 暂停任务 */
    void pause(Long id);

    /** 恢复任务 */
    void resume(Long id);

    /** 立即执行一次 */
    void runOnce(Long id);
}
