package com.nova.admin.modules.system.datascope;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 数据权限注解：标注在 Mapper 方法上，由 {@link DataScopeInnerInterceptor} 在查询时
 * 根据当前登录用户的数据范围（dataScope）自动追加过滤条件。
 *
 * <p>dataScope 取值（来自 sys_role.data_scope）：
 * <ul>
 *   <li>1 全部数据权限 —— 不追加任何条件</li>
 *   <li>2 本部门及下级 —— deptColumn IN (本人部门及所有下级部门)</li>
 *   <li>3 本部门 —— deptColumn = 本人部门</li>
 *   <li>4 本人及下级 —— createBy = 本人（下级以部门树近似，详见 DataScopeHelper）</li>
 *   <li>5 仅本人 —— createBy = 本人</li>
 * </ul>
 */
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface DataScope {

    /** 部门字段所在的表别名（无别名传空串） */
    String deptAlias() default "";

    /** 部门字段名（默认 dept_id） */
    String deptColumn() default "dept_id";

    /** 创建人字段所在的表别名（无别名传空串） */
    String userAlias() default "";

    /** 创建人字段名（默认 create_by） */
    String userColumn() default "create_by";
}
