package com.nova.admin.modules.system.permission;

import com.nova.admin.modules.system.dto.ApiPermissionEndpointDTO;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** 从已注册的 MVC 路由中发现 hasAuthority 权限标识。 */
@Component
public class ApiPermissionScanner {

    private static final Pattern AUTHORITY_PATTERN =
            Pattern.compile("hasAuthority\\s*\\(\\s*['\\\"]([^'\\\"]+)['\\\"]\\s*\\)");
    private static final String MODULE_PACKAGE_PREFIX = "com.nova.admin.modules.";

    private final ObjectProvider<RequestMappingHandlerMapping> handlerMappingProvider;

    public ApiPermissionScanner(
            @Qualifier("requestMappingHandlerMapping")
            ObjectProvider<RequestMappingHandlerMapping> handlerMappingProvider) {
        this.handlerMappingProvider = handlerMappingProvider;
    }

    public Map<String, List<ApiPermissionEndpointDTO>> scan() {
        RequestMappingHandlerMapping handlerMapping = handlerMappingProvider.getObject();
        Map<String, List<ApiPermissionEndpointDTO>> permissions = new java.util.TreeMap<>();
        for (Map.Entry<org.springframework.web.servlet.mvc.method.RequestMappingInfo, HandlerMethod> entry
                : handlerMapping.getHandlerMethods().entrySet()) {
            HandlerMethod handler = entry.getValue();
            if (!handler.getBeanType().getPackageName().startsWith(MODULE_PACKAGE_PREFIX)) {
                continue;
            }
            Set<String> authorities = extractAuthorities(handler);
            if (authorities.isEmpty()) {
                continue;
            }
            List<String> methods = entry.getKey().getMethodsCondition().getMethods().stream()
                    .map(Enum::name)
                    .sorted()
                    .toList();
            if (methods.isEmpty()) {
                methods = List.of("ANY");
            }
            List<String> paths = entry.getKey().getPatternValues().stream().sorted().toList();
            String summary = getSummary(handler);
            for (String authority : authorities) {
                List<ApiPermissionEndpointDTO> endpoints = permissions.computeIfAbsent(authority,
                        ignored -> new ArrayList<>());
                for (String method : methods) {
                    for (String path : paths) {
                        endpoints.add(ApiPermissionEndpointDTO.builder()
                                .method(method)
                                .path(path)
                                .summary(summary)
                                .build());
                    }
                }
            }
        }
        permissions.values().forEach(endpoints -> endpoints.sort(Comparator
                .comparing(ApiPermissionEndpointDTO::getPath)
                .thenComparing(ApiPermissionEndpointDTO::getMethod)));
        return permissions;
    }

    private Set<String> extractAuthorities(HandlerMethod handler) {
        PreAuthorize annotation = AnnotatedElementUtils.findMergedAnnotation(handler.getMethod(), PreAuthorize.class);
        if (annotation == null) {
            annotation = AnnotatedElementUtils.findMergedAnnotation(handler.getBeanType(), PreAuthorize.class);
        }
        if (annotation == null) {
            return Set.of();
        }
        Matcher matcher = AUTHORITY_PATTERN.matcher(annotation.value());
        Set<String> authorities = new java.util.TreeSet<>();
        while (matcher.find()) {
            authorities.add(matcher.group(1));
        }
        return authorities;
    }

    private String getSummary(HandlerMethod handler) {
        Operation operation = AnnotatedElementUtils.findMergedAnnotation(handler.getMethod(), Operation.class);
        return operation == null || operation.summary().isBlank()
                ? handler.getMethod().getName()
                : operation.summary();
    }
}
