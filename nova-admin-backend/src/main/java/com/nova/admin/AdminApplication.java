package com.nova.admin;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Nova Admin 启动入口
 */
@SpringBootApplication
@MapperScan("com.nova.admin.**.mapper")
@EnableAsync
@EnableScheduling
public class AdminApplication {

    static void main(String[] args) {
        SpringApplication.run(AdminApplication.class, args);
    }
}
