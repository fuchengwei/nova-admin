package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nova.admin.modules.system.entity.SysDept;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 部门 Mapper
 */
@Mapper
public interface SysDeptMapper extends BaseMapper<SysDept> {

    /**
     * 按 sort ASC 排序查询所有未删除部门
     */
    @Select("SELECT * FROM sys_dept WHERE deleted = 0 ORDER BY sort")
    List<SysDept> selectListBySortOrder();
}
