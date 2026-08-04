package com.nova.admin.modules.system.datascope;

import com.baomidou.mybatisplus.extension.plugins.inner.InnerInterceptor;
import com.nova.admin.security.LoginUser;
import com.nova.admin.security.SecurityUtils;
import com.nova.admin.common.api.ResultCode;
import com.nova.admin.common.exception.BizException;
import lombok.RequiredArgsConstructor;
import org.apache.ibatis.executor.Executor;
import org.apache.ibatis.mapping.BoundSql;
import org.apache.ibatis.mapping.MappedStatement;
import org.apache.ibatis.mapping.SqlCommandType;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.reflection.SystemMetaObject;
import org.apache.ibatis.session.ResultHandler;
import org.apache.ibatis.session.RowBounds;

import java.lang.reflect.Method;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 数据权限内嵌拦截器：在执行 SELECT 前，根据 Mapper 方法上的 {@link DataScope} 注解
 * 以及当前登录用户的数据范围，向 SQL 追加部门/人员过滤条件。
 *
 * <p>为避免引入额外 SQL 解析依赖，这里采用针对本项目受控查询（单表 + 至多一个顶层 WHERE）
 * 的字符串改写：在顶层 WHERE 之后（或 ORDER BY 之前）注入 {@code AND (scopeSql)}。
 * 对分页 COUNT 包装（{@code SELECT COUNT(*) FROM (...) tmp}) 同样有效。
 */
@RequiredArgsConstructor
public class DataScopeInnerInterceptor implements InnerInterceptor {

    private final DataScopeHelper helper;

    /** 注解解析结果缓存：MappedStatement id -> 注解（NULL 表示无注解） */
    private final Map<String, DataScope> cache = new ConcurrentHashMap<>();
    private static final DataScope NULL = new DataScope() {
        @Override public Class<? extends java.lang.annotation.Annotation> annotationType() { return DataScope.class; }
        @Override public String deptAlias() { return ""; }
        @Override public String deptColumn() { return ""; }
        @Override public String userAlias() { return ""; }
        @Override public String userColumn() { return ""; }
    };

    @Override
    public void beforeQuery(Executor executor, MappedStatement ms, Object parameter,
                            RowBounds rowBounds, ResultHandler resultHandler, BoundSql boundSql) {
        if (!SqlCommandType.SELECT.equals(ms.getSqlCommandType())) {
            return;
        }
        DataScope ann = resolveAnnotation(ms);
        if (ann == null) {
            return;
        }
        LoginUser user = SecurityUtils.getLoginUser().orElse(null);
        if (user == null) {
            return;
        }
        String scopeSql = helper.buildScopeSql(user, ann);
        if (scopeSql == null || scopeSql.isBlank()) {
            return;
        }

        try {
            String newSql = injectWhere(boundSql.getSql(), scopeSql);
            MetaObject metaObject = SystemMetaObject.forObject(boundSql);
            metaObject.setValue("sql", newSql);
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(DataScopeInnerInterceptor.class)
                    .error("数据权限 SQL 改写失败，拒绝执行查询：{}", e.getMessage(), e);
            throw new BizException(ResultCode.DATA_SCOPE_DENIED, "数据权限条件生成失败");
        }
    }

    /**
     * 将过滤条件注入 SQL：
     * <ul>
     *   <li>存在顶层 WHERE：在 ORDER BY 之前（或无 ORDER BY 时语句末尾）追加 {@code AND (scopeSql)}</li>
     *   <li>不存在 WHERE：在 ORDER BY 之前（或语句末尾）追加 {@code WHERE (scopeSql)}</li>
     * </ul>
     */
    private String injectWhere(String sql, String scopeSql) {
        String lower = sql.toLowerCase();
        int whereIdx = lower.indexOf(" where ");
        int orderByIdx = lower.indexOf(" order by ");

        if (whereIdx >= 0) {
            if (orderByIdx > whereIdx) {
                return sql.substring(0, orderByIdx) + " AND (" + scopeSql + ")" + sql.substring(orderByIdx);
            }
            return sql + " AND (" + scopeSql + ")";
        }
        if (orderByIdx >= 0) {
            return sql.substring(0, orderByIdx) + " WHERE (" + scopeSql + ") " + sql.substring(orderByIdx);
        }
        return sql + " WHERE (" + scopeSql + ")";
    }

    private DataScope resolveAnnotation(MappedStatement ms) {
        String id = ms.getId();
        DataScope cached = cache.get(id);
        if (cached != null) {
            return cached == NULL ? null : cached;
        }
        DataScope ann = doResolve(id);
        cache.put(id, ann == null ? NULL : ann);
        return ann;
    }

    private DataScope doResolve(String mappedId) {
        int lastDot = mappedId.lastIndexOf('.');
        if (lastDot < 0) {
            return null;
        }
        String className = mappedId.substring(0, lastDot);
        String methodName = mappedId.substring(lastDot + 1);
        // 去掉 MyBatis-Plus 分页 COUNT 语句后缀
        if (methodName.endsWith("_COUNT")) {
            methodName = methodName.substring(0, methodName.length() - 6);
        }
        try {
            Class<?> clazz = Class.forName(className);
            for (Method m : clazz.getMethods()) {
                if (m.getName().equals(methodName)) {
                    DataScope a = m.getAnnotation(DataScope.class);
                    if (a != null) {
                        return a;
                    }
                }
            }
        } catch (ClassNotFoundException ignored) {
            // 匿名/内置 statement 忽略
        }
        return null;
    }
}
