package com.nova.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 登录日志
 */
@Data
@TableName("sys_login_log")
public class SysLoginLog implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 账号 */
    private String account;

    /** IP地址 */
    private String ip;

    /** 用户代理 */
    private String userAgent;

    /** 操作系统 */
    private String os;

    /** 浏览器 */
    private String browser;

    /** 登录状态：1成功 0失败 */
    private Integer status;

    /** 提示消息 */
    private String msg;

    /** 登录时间 */
    private LocalDateTime loginTime;
}
