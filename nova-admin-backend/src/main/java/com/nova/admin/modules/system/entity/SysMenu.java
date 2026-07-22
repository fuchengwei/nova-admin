package com.nova.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.nova.admin.common.base.BaseDO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.util.ArrayList;
import java.util.List;

/**
 * 菜单/权限
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sys_menu")
public class SysMenu extends BaseDO {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long parentId;
    private String name;
    /** M目录 C菜单 F按钮 */
    private String type;
    /** 权限标识 */
    private String perms;
    private String path;
    private String component;
    private String redirect;
    private String icon;
    private Integer sort;
    /** 1 显示 0 隐藏 */
    private Integer visible;
    /** 1 启用 0 停用 */
    private Integer status;
    /** 1 缓存 0 不缓存 */
    private Integer keepAlive;
    /** 1 总是显示 0 否 */
    private Integer alwaysShow;

    /** 子菜单（树形组装用） */
    @TableField(exist = false)
    private List<SysMenu> children = new ArrayList<>();
}
