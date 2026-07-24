package com.nova.admin.common.exception;

import com.nova.admin.common.api.R;
import com.nova.admin.common.api.ResultCode;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

/**
 * 全局异常处理
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** 业务异常 */
    @ExceptionHandler(BizException.class)
    public R<Void> handleBiz(BizException ex, HttpServletRequest req) {
        log.warn("[BizException] {} {} -> code={}, msg={}",
                req.getMethod(), req.getRequestURI(), ex.getCode(), ex.getMessage());
        return R.fail(ex.getCode(), ex.getMessage());
    }

    /** 校验失败 */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<Void> handleValid(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));
        return R.fail(ResultCode.BAD_REQUEST.getCode(), msg);
    }

    /** 表单校验失败 */
    @ExceptionHandler(BindException.class)
    public R<Void> handleBind(BindException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));
        return R.fail(ResultCode.BAD_REQUEST.getCode(), msg);
    }

    /** 缺少参数 */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public R<Void> handleMissingParam(MissingServletRequestParameterException ex) {
        return R.fail(ResultCode.BAD_REQUEST.getCode(),
                "缺少参数: " + ex.getParameterName());
    }

    /** 参数类型错误 */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public R<Void> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return R.fail(ResultCode.BAD_REQUEST.getCode(),
                "参数类型错误: " + ex.getName());
    }

    /** 请求方法不允许 */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<R<Void>> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(R.fail(ResultCode.METHOD_NOT_ALLOWED.getCode(),
                        "不支持 " + ex.getMethod() + " 方法"));
    }

    /** Spring Security 认证失败 */
    @ExceptionHandler(AuthenticationException.class)
    public R<Void> handleAuthentication(AuthenticationException ex) {
        return R.fail(ResultCode.UNAUTHORIZED.getCode(),
                ex.getMessage() == null ? ResultCode.UNAUTHORIZED.getMsg() : ex.getMessage());
    }

    /** Spring Security 权限不足 */
    @ExceptionHandler(AccessDeniedException.class)
    public R<Void> handleAccessDenied(AccessDeniedException ex) {
        return R.fail(ResultCode.FORBIDDEN.getCode(),
                ex.getMessage() == null ? ResultCode.FORBIDDEN.getMsg() : ex.getMessage());
    }

    /** 兜底 */
    @ExceptionHandler(Exception.class)
    public R<Void> handleAll(Exception ex, HttpServletRequest req) {
        log.error("[UnhandledException] {} {}", req.getMethod(), req.getRequestURI(), ex);
        return R.fail(ResultCode.INTERNAL_ERROR.getCode(),
                "系统异常: " + ex.getClass().getSimpleName());
    }

    private String formatFieldError(FieldError fe) {
        return fe.getField() + ": " + fe.getDefaultMessage();
    }
}
