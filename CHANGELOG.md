# Changelog

所有重要变更记录在此文件。格式参考 [Keep a Changelog](https://keepachangelog.com/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-07-22

### 新增
- **认证模块**：图形验证码、登录/注销/刷新令牌、BCrypt 密码校验、Redis 黑名单、登录失败锁定。
- **RBAC 核心**：用户管理、角色管理、部门管理（树形）、菜单/权限管理（目录/菜单/按钮三级）、动态路由。
- **数据权限**：5 级（全部/本部门及下级/本部门/本人及下级/本人）+ 自定义部门；`@DataScope` 注解 + MyBatis-Plus `DataScopeInnerInterceptor` 改写 SQL。
- **字典管理**：字典类型/数据 CRUD、缓存预热、前端 `useDict` Hook。
- **日志管理**：`@Log` 注解 + AOP 切面记录操作日志；登录日志记录、查询与清空。
- **文件存储**：本地（默认）/ MinIO 策略模式上传下载、文件预览、文件管理页。
- **定时任务**：基于 Spring TaskScheduler 的动态调度、`sys_job` / `sys_job_log`、CRON 表达式、任务启停与日志。
- **代码生成器**：表结构导入、字段配置、Velocity 模板生成后端 CRUD + 前端脚手架。
- **国际化**：后端 `MessageSource` + 前端 `react-i18next`，中英双语。
- **系统监控**：服务器信息（CPU/内存/JVM/磁盘）、在线用户、缓存监控（基于 MXBean + Redis INFO）。
- **工程化**：后端多阶段 `Dockerfile`、前端 `Dockerfile` + `nginx.conf`、生产 `docker-compose.prod.yml`、部署文档。

### 技术栈
- 后端：Spring Boot 4.1.0 + Java 25、Spring Security 7.1、MyBatis-Plus 3.5.15、PostgreSQL 17、Redis 8、Redisson 4.6。
- 前端：Vite 8 + React 19 + TypeScript 7、Ant Design 6.5、Tailwind CSS 4、Zustand 5、TanStack Query 5。

[1.0.0]: https://github.com/your-org/nova-admin/releases/tag/v1.0.0
