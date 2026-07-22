package com.nova.admin.modules.system.datascope;

import com.nova.admin.modules.system.service.SysDeptService;
import com.nova.admin.security.LoginUser;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 根据当前登录用户的数据范围，生成可用于 SQL WHERE 的布尔表达式片段。
 *
 * <p>返回 null 表示不加任何过滤（全部数据权限）。
 *
 * <p>注意：{@code deptService} 使用 {@link Lazy} 注入。本类在 MyBatis 的
 * {@code sqlSessionFactory} 构建阶段（MybatisPlusAutoConfiguration）就需要就绪，
 * 而 deptService 底层依赖 Mapper / sqlSessionFactory，直接注入会形成启动期循环依赖。
 * 改为懒加载代理后，仅在请求真正执行带 @DataScope 的查询时才会初始化 deptService。
 */
@Component
public class DataScopeHelper {

    private final SysDeptService deptService;

    public DataScopeHelper(@Lazy SysDeptService deptService) {
        this.deptService = deptService;
    }

    /**
     * 生成数据权限过滤 SQL 片段（不含 AND 关键字，调用方负责拼接）。
     *
     * @return null 表示全量；否则为形如 {@code dept_id IN (1,2,3)} 的表达式
     */
    public String buildScopeSql(LoginUser user, DataScope ann) {
        Integer scope = user.getDataScope();
        if (scope == null || scope == 1) {
            return null; // 全部数据权限
        }
        Long deptId = user.getDeptId();
        Long userId = user.getUserId();
        String deptCol = column(ann.deptAlias(), ann.deptColumn());
        String userCol = column(ann.userAlias(), ann.userColumn());

        switch (scope) {
            case 2: // 本部门及下级
                if (deptId == null) {
                    return "1=0";
                }
                return deptCol + " IN (" + joinIds(deptService.findSelfAndDescendantIds(deptId)) + ")";
            case 3: // 本部门
                if (deptId == null) {
                    return "1=0";
                }
                return deptCol + " = " + deptId;
            case 4: // 本人及下级：本人创建 + 本人所在部门及下级（下级部门近似“下级人员”）
                if (deptId != null) {
                    String ids = joinIds(deptService.findSelfAndDescendantIds(deptId));
                    return "(" + userCol + " = " + userId + " OR " + deptCol + " IN (" + ids + "))";
                }
                return userCol + " = " + userId;
            case 5: // 仅本人
                return userCol + " = " + userId;
            default:
                return null;
        }
    }

    private static String column(String alias, String col) {
        return (alias == null || alias.isBlank()) ? col : alias + "." + col;
    }

    private static String joinIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return "0";
        }
        return ids.stream().map(String::valueOf).collect(Collectors.joining(","));
    }
}
