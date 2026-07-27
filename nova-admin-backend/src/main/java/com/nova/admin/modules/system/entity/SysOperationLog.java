package com.nova.admin.modules.system.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 操作日志
 */
@Data
@TableName("sys_operation_log")
public class SysOperationLog implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @TableId(type = IdType.ASSIGN_ID)
    @JsonSerialize(using = ToStringSerializer.class)
    private Long id;

    /** 操作模块 */
    private String module;

    /** 操作动作 */
    private String action;

    /** 操作描述 */
    private String description;

    /** 请求方法 */
    private String requestMethod;

    /** 请求URL */
    private String requestUrl;

    /** Java方法 */
    private String javaMethod;

    /** Java方法参数 */
    private String javaArgs;

    /** 操作用户ID */
    private Long userId;

    /** 操作账号 */
    private String account;

    /** IP地址 */
    private String ip;

    /** 用户代理 */
    private String userAgent;

    /** 耗时（毫秒） */
    private Long costMs;

    /** 操作状态：1成功 0失败 */
    private Integer status;

    /** 错误消息 */
    private String errorMsg;

    /** 创建时间 */
    private LocalDateTime createTime;
}
