package com.nova.admin.common.aspect;

import com.nova.admin.modules.system.entity.SysOperationLog;
import com.nova.admin.modules.system.service.SysOperationLogService;
import com.nova.admin.security.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class OperationLogAspect {

    private final SysOperationLogService operationLogService;

    @Around("within(@org.springframework.web.bind.annotation.RestController *) && " +
            "execution(* com.nova.admin.modules..*(..))")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        SysOperationLog opLog = new SysOperationLog();
        boolean success = true;
        String errorMsg = null;

        try {
            fillRequestInfo(pjp, opLog);
            Object result = pjp.proceed();
            return result;
        } catch (Throwable t) {
            success = false;
            errorMsg = t.getMessage();
            throw t;
        } finally {
            opLog.setStatus(success ? 1 : 0);
            opLog.setErrorMsg(errorMsg);
            opLog.setCostMs(System.currentTimeMillis() - start);
            opLog.setCreateTime(LocalDateTime.now());
            CompletableFuture.runAsync(() -> {
                try {
                    operationLogService.save(opLog);
                } catch (Exception e) {
                    log.warn("保存操作日志失败", e);
                }
            });
        }
    }

    private void fillRequestInfo(ProceedingJoinPoint pjp, SysOperationLog opLog) {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        Method method = sig.getMethod();
        Class<?> clazz = pjp.getTarget().getClass();

        Tag tag = clazz.getAnnotation(Tag.class);
        if (tag != null) {
            opLog.setModule(tag.name());
        }

        Operation operation = method.getAnnotation(Operation.class);
        if (operation != null) {
            opLog.setDescription(operation.summary());
        }

        opLog.setJavaMethod(clazz.getSimpleName() + "." + method.getName());

        try {
            Object[] args = pjp.getArgs();
            if (args != null && args.length > 0) {
                opLog.setJavaArgs(Arrays.toString(args));
            }
        } catch (Exception ignored) {
        }

        SecurityUtils.getLoginUser().ifPresent(u -> {
            opLog.setUserId(u.getUserId());
            opLog.setAccount(u.getAccount());
        });

        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            HttpServletRequest req = attrs.getRequest();
            opLog.setRequestMethod(req.getMethod());
            opLog.setRequestUrl(req.getRequestURI());
            opLog.setIp(resolveIp(req));
            opLog.setUserAgent(req.getHeader("User-Agent"));
        }
    }

    private String resolveIp(HttpServletRequest req) {
        String ip = req.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
            int idx = ip.indexOf(',');
            return idx > 0 ? ip.substring(0, idx).trim() : ip.trim();
        }
        ip = req.getHeader("X-Real-IP");
        if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
            return ip;
        }
        return req.getRemoteAddr();
    }
}
