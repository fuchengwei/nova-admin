package com.nova.admin.modules.job.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.nova.admin.common.base.BaseDO;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 定时任务
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_job")
public class SysJob extends BaseDO {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 任务名称 */
    private String jobName;

    /** 任务组（默认 DEFAULT） */
    private String jobGroup;

    /** 调用目标（格式：springBeanName.method 或 beanName.method(arg)） */
    private String invokeTarget;

    /** cron 表达式 */
    private String cronExpression;

    /** 状态：0 暂停，1 运行 */
    private Integer status;

    /** 错过策略：DO_NOTHING / FIRE_NOW */
    private String misfirePolicy;

    /** 是否允许并发：0 禁止，1 允许 */
    private Integer concurrent;

    /** 备注 */
    private String remark;
}
