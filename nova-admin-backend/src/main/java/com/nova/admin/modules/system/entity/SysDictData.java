package com.nova.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.nova.admin.common.base.BaseDO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;

/**
 * 字典数据
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_dict_data")
public class SysDictData extends BaseDO {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 字典类型ID */
    private Long typeId;

    /** 字典标签 */
    private String label;

    /** 字典值 */
    private String value;

    /** CSS 样式 */
    private String cssClass;

    /** 排序号 */
    private Integer sort;

    /** 状态：1启用 0停用 */
    private Integer status;

    /** 是否默认：1是 0否 */
    private Integer defaultFlag;
}
