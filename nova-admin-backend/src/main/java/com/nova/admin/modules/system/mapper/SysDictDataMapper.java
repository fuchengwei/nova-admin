package com.nova.admin.modules.system.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nova.admin.modules.system.entity.SysDictData;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 字典数据 Mapper
 */
@Mapper
public interface SysDictDataMapper extends BaseMapper<SysDictData> {

    /**
     * 按字典类型ID查询字典数据
     */
    @Select("SELECT * FROM sys_dict_data WHERE type_id = #{typeId} AND deleted = 0 ORDER BY sort ")
    List<SysDictData> selectByTypeId(Long typeId);
}
