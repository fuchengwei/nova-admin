package com.nova.admin.common.api;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 业务结果码
 */
@Getter
@AllArgsConstructor
public enum ResultCode {

    SUCCESS(0, "success"),
    FAIL(1, "fail"),

    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未认证或登录已过期"),
    FORBIDDEN(403, "无访问权限"),
    NOT_FOUND(404, "资源不存在"),
    METHOD_NOT_ALLOWED(405, "请求方法不允许"),
    CONFLICT(409, "资源冲突"),

    INTERNAL_ERROR(500, "服务器内部错误"),
    SERVICE_UNAVAILABLE(503, "服务暂不可用"),

    // 业务 1xxx
    USERNAME_OR_PASSWORD_INVALID(1001, "用户名或密码错误"),
    CAPTCHA_INVALID(1002, "验证码错误或已过期"),
    USER_DISABLED(1003, "账号已被停用"),
    USER_LOCKED(1004, "账号已被锁定，请稍后再试"),
    USER_NOT_FOUND(1005, "用户不存在"),
    USERNAME_EXISTS(1006, "用户名已存在"),
    PASSWORD_NOT_MATCH(1007, "原密码不正确"),

    TOKEN_INVALID(1101, "Token 无效或已过期"),
    TOKEN_EXPIRED(1102, "Token 已过期"),
    REFRESH_TOKEN_INVALID(1103, "RefreshToken 无效"),

    DATA_NOT_FOUND(1201, "数据不存在"),
    DATA_EXISTS(1202, "数据已存在"),
    DATA_OPERATION_FAILED(1203, "数据操作失败"),

    PERMISSION_DENIED(1301, "没有该接口的访问权限"),
    DATA_SCOPE_DENIED(1302, "数据权限不足");

    private final int code;
    private final String msg;
}
