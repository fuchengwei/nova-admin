package com.nova.admin.modules.job.dto;

import com.nova.admin.common.api.PageQuery;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class JobPageQuery extends PageQuery {

    /** 任务名称（模糊） */
    private String jobName;

    /** 任务状态：0 暂停，1 运行 */
    private Integer status;

    /** 任务组 */
    private String jobGroup;
}
