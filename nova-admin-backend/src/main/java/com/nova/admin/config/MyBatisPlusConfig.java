package com.nova.admin.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.plugins.inner.OptimisticLockerInnerInterceptor;
import com.nova.admin.modules.system.datascope.DataScopeHelper;
import com.nova.admin.modules.system.datascope.DataScopeInnerInterceptor;
import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

/**
 * MyBatis-Plus 配置
 * <p>
 * 注：3.5.15+ 已不再提供 PaginationInnerInterceptor，分页由 MybatisPlusAutoConfiguration
 * 自动识别 Mapper 方法中的 {@code Page<T>} 参数处理。这里只配置额外的内嵌拦截器。
 */
@Slf4j
@Configuration
public class MyBatisPlusConfig {

    @Bean
    public MybatisPlusInterceptor mybatisPlusInterceptor(DataScopeHelper dataScopeHelper) {
        MybatisPlusInterceptor interceptor = new MybatisPlusInterceptor();
        // 乐观锁（@Version 字段自动处理）
        interceptor.addInnerInterceptor(new OptimisticLockerInnerInterceptor());
        // 数据权限：根据当前登录用户的数据范围自动追加部门/人员过滤条件
        interceptor.addInnerInterceptor(new DataScopeInnerInterceptor(dataScopeHelper));
        return interceptor;
    }

    @Bean
    public MetaObjectHandler metaObjectHandler() {
        return new MetaObjectHandler() {
            @Override
            public void insertFill(MetaObject metaObject) {
                LocalDateTime now = LocalDateTime.now();
                strictInsertFill(metaObject, "createTime", LocalDateTime.class, now);
                strictInsertFill(metaObject, "updateTime", LocalDateTime.class, now);
                // createBy/updateBy 由框架层填充当前用户 ID
            }

            @Override
            public void updateFill(MetaObject metaObject) {
                strictUpdateFill(metaObject, "updateTime", LocalDateTime.class, LocalDateTime.now());
            }
        };
    }
}
