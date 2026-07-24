package com.nova.admin.modules.monitor.dto;

import lombok.Data;

import java.io.Serializable;

/** 在线用户 */
@Data
public class OnlineUser implements Serializable {
    private static final long serialVersionUID = 1L;

    /** 登录账号（作为唯一标识） */
    private String tokenKey;
    private String account;
    private String nickname;
    private Long deptId;
    private String loginIp;
    private String loginTime;
}
