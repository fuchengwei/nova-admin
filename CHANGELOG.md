# Changelog

所有重要变更记录在此文件。格式参考 [Keep a Changelog](https://keepachangelog.com/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 新增

- **站内消息通知中心**：Header 新增通知铃铛，支持当前用户最近消息、未读数量、单条已读和全部已读；新增消息发布页，可按全部用户、角色或用户投递消息；消息表与收件记录由初始化 SQL 创建，并已接入定时任务失败通知、执行详情深链和基于 SSE 的实时角标刷新。
- **接口权限发现与同步**：系统管理新增独立的接口权限菜单，支持扫描受 `@PreAuthorize` 保护的真实接口；接口权限独立于菜单按钮存储，可注册发现的权限、为已注册权限分配角色，并自动刷新受影响用户权限；初始化 SQL 会迁移已有菜单按钮权限。
- **定时任务执行历史**：自动、手动和并发跳过的任务执行均会持久化为可筛选历史记录；任务管理页可按任务查看执行结果与失败详情。
- **雪花 ID 传输约定**：所有对外 JSON 响应中的雪花 ID 统一序列化为字符串，前端 ID 类型同步改为 `string`，避免 JavaScript 精度丢失。
- **用户批量导入导出**：用户管理支持带中文字段和下拉选项的 Excel 模板、批量导入和导出；导出不包含密码，导入使用统一初始密码并逐行校验账号、部门和角色后返回失败明细。
- **首页仪表盘**：新增认证即可访问的 `GET /api/dashboard/overview` 聚合接口，提供业务规模、7 天/30 天登录与操作趋势、运行摘要及最近动态。
- **数据可视化**：首页新增业务规模指标带、趋势折线图、运行指标进度环和近期动态时间线，中英双语支持。
- **会话管理**：access token 必须存在对应的 Redis 服务端会话；支持多设备会话、refresh token 原子轮换及在线用户踢下线（`DELETE /api/monitor/online/{accessJti}`）。用户状态、密码、角色或菜单变更后会撤销受影响会话，并通过 `GET /api/auth/session-events` 主动通知浏览器。
- **个人会话管理**：个人中心新增登录设备列表，可退出指定设备或退出其他设备；认证失败和权限不足统一返回 HTTP `401/403` 及 `R` 响应体。
- **安全策略生效**：系统设置中的验证码开关、登录失败锁定阈值/时长、Access/Refresh Token 有效期已接入认证流程；验证码接口增加 `enabled` 字段，登录页会自动适配开关状态。
- **审计日志增强**：操作参数按敏感字段脱敏；日志页支持查看请求与失败详情，日志清理改为按保留天数删除过期记录。
- **系统公告**：已启用公告会在用户进入系统时以全局弹窗展示，并支持当前浏览器会话内关闭；公告发布工作台支持受限富文本编辑、实时预览与安全 HTML 渲染，展示接口不会泄露邮件和短信通道配置。
- **对象存储**：文件服务已接入 MinIO，支持自动建桶、上传、预览和删除；管理员可在上传策略中选择本地磁盘或 MinIO，并继续通过统一预览地址访问文件。
- **存储连接检测**：上传策略支持直接检测本地磁盘目录或 MinIO 存储桶的可用性。
- **密码生命周期**：新增首次创建、批量导入和管理员重置后的强制改密；安全设置支持密码有效期。待改密账号仅可查看自身信息、修改密码、刷新或退出会话。

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

### 修复

- 修复启动期 Bean 循环依赖：`DataScopeHelper` 在 MyBatis `sqlSessionFactory` 构建阶段即被需要，而其注入的 `SysDeptService` 底层依赖 Mapper 会形成循环。改为对 `SysDeptService` 使用 `@Lazy` 懒加载代理，仅在请求执行带 `@DataScope` 的查询时才初始化。

### 技术栈

- 后端：Spring Boot 4.1.0 + Java 25、Spring Security 7.1、MyBatis-Plus 3.5.15、PostgreSQL 17、Redis 8、Redisson 4.6。
- 前端：Vite 8 + React 19 + TypeScript 7、Ant Design 6.5、Tailwind CSS 4、Zustand 5、TanStack Query 5。

[1.0.0]: https://github.com/your-org/nova-admin/releases/tag/v1.0.0
