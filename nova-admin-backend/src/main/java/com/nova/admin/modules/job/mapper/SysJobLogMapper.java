package com.nova.admin.modules.job.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nova.admin.modules.job.entity.SysJobLog;
import org.apache.ibatis.annotations.Mapper;

/** 定时任务执行历史 Mapper。 */
@Mapper
public interface SysJobLogMapper extends BaseMapper<SysJobLog> {
}
