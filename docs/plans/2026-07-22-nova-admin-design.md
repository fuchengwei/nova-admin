# Nova Admin — 通用 RBAC 后台权限管理系统设计文档

> 版本：v1.2
> 日期：2026-07-22
> 类型：后端管理系统 / RBAC 权限平台
> 默认分支：`master`

---

## 一、项目概述

### 1.1 项目名称与定位
- **项目名**：`nova-admin`
- **定位**：面向中小型团队的通用 RBAC 后台权限管理系统，提供开箱即用的用户/角色/菜单/数据权限能力，并集成字典、日志、代码生成、文件存储、定时任务、国际化等常见中后台能力。
- **目标用户**：企业内部业务系统的管理后台、Saas 控制台、运营平台。

### 1.2 关键决策摘要
| 决策点 | 选型 |
| --- | --- |
| 项目组织 | Monorepo 单仓库（默认分支 `master`） |
| 后端框架 | **Spring Boot 4.1.0** + **Java 25** |
| 前端框架 | **Vite 8.0** + **React 19** + **TypeScript 7.0** |
| UI 库 | **Ant Design 6.5.0** + **Tailwind CSS 4** |
| 状态管理 | Zustand 5 + TanStack Query 5 |
| 认证 | **Spring Security 7.1.0** + JJWT 0.12.x + Redis 黑名单 |
| ORM | **MyBatis-Plus** | 单表 CRUD/分页/动态条件/复杂 SQL |
| 主数据库 | **PostgreSQL 17** |
| 缓存/会话 | **Redis 8** |
| 数据权限 | 5 级 (RuoYi 风格) + `@DataScope` 注解 + MyBatis 拦截器 |

---

## 二、系统功能需求

### 2.1 核心 RBAC 模块
| 模块 | 关键能力 |
| --- | --- |
| **用户管理** | 用户 CRUD、密码重置、分配角色/部门、停用/启用、用户导入导出、头像上传 |
| **角色管理** | 角色 CRUD、分配菜单权限、分配数据权限范围、分配部门、状态管理 |
| **菜单/权限管理** | 树形菜单 CRUD（目录/菜单/按钮）、权限标识（perms）配置、路由元信息、图标选择 |
| **部门管理** | 树形部门 CRUD、负责人配置、状态管理 |
| **数据权限** | 5 级（全部/本部门及下级/本部门/本人及下级/本人）+ 自定义部门 |
| **认证** | 登录、注销、刷新令牌、图形验证码、登录失败锁定、踢人下线 |

### 2.2 系统增强模块
| 模块 | 关键能力 |
| --- | --- |
| **字典管理** | 字典类型/字典数据 CRUD、缓存预热 |
| **操作日志** | 基于 `@Log` 注解 + AOP 自动记录方法调用、SpEL 入参解析、异步落库 |
| **登录日志** | 记录 IP/UA/操作系统/浏览器/登录结果、清空日志 |
| **代码生成器** | 表导入、字段配置、生成 Controller/Service/Mapper/VO/前端页面（Velocity 模板） |
| **文件存储** | 本地/MinIO 策略模式上传下载、文件预览、文件管理 |
| **定时任务** | 基于 Spring Scheduling + DB 持久化、CRON 表达式、任务日志、状态启停 |
| **国际化** | 后端 MessageSource + 前端 react-i18next，中英双语 |
| **系统监控** | 在线用户、缓存监控、服务健康（基于 Spring Boot Actuator） |

### 2.3 非功能性需求
- 密码使用 BCrypt 加密（强度 10）
- 关键操作接口幂等
- 列表分页统一 PageQuery/PageResult 包装
- 统一错误码与统一响应体
- 关键 SQL 走索引，慢 SQL 监控
- 关键变更全链路审计
- API 接口 OpenAPI 3 文档（springdoc-openapi）

---

## 三、技术栈详细清单

### 3.1 后端（`nova-admin-backend`）
| 类别 | 组件 | 版本 | 用途 |
| --- | --- | --- | --- |
| 语言 | OpenJDK | **25** | LTS（Spring Boot 4.x 基线） |
| 框架 | Spring Boot | **4.1.0** | 基础脚手架（默认含 Spring Framework 7.0.8） |
| 安全 | Spring Security | **7.1.0** | 认证授权 |
| Token | JJWT | 0.12.6 | JWT 签发与解析 |
| ORM | MyBatis-Plus | 3.5.15+ | CRUD/分页/动态条件/复杂 SQL（Lambda + XML） |
| 数据库 | PostgreSQL | **17** | 主存储 |
| 驱动 | postgresql | 42.7.x | JDBC 驱动 |
| 缓存 | Redisson | 3.40+ | Redis 客户端/分布式锁 |
| 缓存 | Spring Data Redis | 4.0+ | Redis 抽象层 |
| 工具 | Hutool | 5.8.x | 工具集 |
| 工具 | MapStruct | 1.6.x | DTO 转换 |
| 工具 | Lombok | 1.18.40+ | 简化代码 |
| 接口 | springdoc-openapi | 2.7+ | OpenAPI 文档 |
| 校验 | jakarta.validation | 3.x | 参数校验 |
| 测试 | JUnit 5 + Mockito | 5.x | 单元测试 |
| 构建 | Maven | 3.9.x | 依赖管理 |

> **不引入 dynamic-datasource**。项目使用单一主库；如未来需要多数据源，会在 `application-xxx.yml` 配置多套 DataSource Bean，由 jOOQ/MyBatis-Plus 显式切换。

### 3.2 前端（`nova-admin-frontend`）
| 类别 | 组件 | 版本 | 用途 |
| --- | --- | --- | --- |
| 脚手架 | Vite | **8.0** | 构建（Rolldown 内核） |
| 框架 | React | **19** | UI 框架 |
| 语言 | TypeScript | **7.0** | 类型（Go 原生编译器） |
| 路由 | React Router | 7.x | 路由 |
| UI | Ant Design | **6.5.0** | 组件库 |
| 样式 | Tailwind CSS | **4** | 原子化样式（Oxide 引擎） |
| 状态 | Zustand | 5.x | 客户端状态 |
| 服务端状态 | TanStack Query | 5.x | 接口缓存/请求 |
| HTTP | Axios | 1.7.x | 请求 |
| 工具 | ahooks | 3.8.x | Hooks |
| 工具 | dayjs | 1.11.x | 时间 |
| 图标 | @ant-design/icons | 6.x | 图标 |
| 国际化 | react-i18next | 15.x | 多语言 |
| 工具 | clsx + tailwind-merge | - | className 合并 |
| 代码规范 | ESLint + Prettier | 9.x / 3.x | 规范 |
| 测试 | Vitest | 2.x | 单元测试 |

### 3.3 基础设施
| 组件 | 版本 | 用途 |
| --- | --- | --- |
| Docker | 24+ | 容器化 |
| Docker Compose | v2 | 本地起 PG/Redis/MinIO |
| Nginx | 1.27 | 前端部署/反向代理 |

---

## 四、系统架构

### 4.1 整体架构图
```
┌─────────────────────────────────────────────────┐
│                  Browser (SPA)                  │
│  Vite 8 + React 19 + AntD 6 + Tailwind 4        │
│  Zustand (UI) + TanStack Query (Server)         │
│  Axios + Interceptors                           │
└────────────────────┬────────────────────────────┘
                     │ HTTPS / JWT
                     ▼
┌─────────────────────────────────────────────────┐
│           Spring Boot 4.1.0 Backend             │
│ ┌─────────────────────────────────────────────┐ │
│ │ Controller (REST + Validation)              │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Service (Transaction + Business Rules)      │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Data Access Layer                           │ │
│ │  MyBatis-Plus  (CRUD/分页/动态条件/复杂 SQL) │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Spring Security 7 Filter Chain              │ │
│ │  → JwtAuthFilter → AuthorizationFilter      │ │
│ └─────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────┐ │
│ │ Cross-Cutting                               │ │
│ │  GlobalExceptionAdvice / AOP Log / i18n     │ │
│ │  Redisson Distributed Lock / Rate Limiter   │ │
│ └─────────────────────────────────────────────┘ │
└────────────────────┬─────────────┬──────────────┘
                     │             │
                     ▼             ▼
            ┌─────────────┐  ┌─────────────┐
            │ PostgreSQL 17│ │   Redis 8   │
            │  (主存储)    │  │ (缓存/会话) │
            └─────────────┘  └─────────────┘
```

### 4.2 后端分层
```
com.nova.admin
├── admin                 // 启动模块
│   ├── AdminApplication
│   └── config            // Web/Security/Redis/OpenAPI/MyBatis 配置
├── common                // 通用模块
│   ├── api               // 统一响应 R<T>
│   ├── exception         // 业务异常 + 全局处理
│   ├── base              // BaseDO/BaseController
│   ├── util              // 工具类
│   └── constant          // 常量
├── framework             // 框架封装
│   ├── security          // JWT/Filter/UserDetails
│   ├── mybatis           // 分页/数据权限拦截器
│   ├── redis             // RedisService
│   ├── log               // @Log + 切面
│   ├── i18n              // MessageUtils
│   └── ratelimit         // 限流
├── modules               // 业务模块
│   ├── auth              // 认证
│   ├── system            // 用户/角色/菜单/部门/字典/日志
│   ├── infra             // 文件/任务
│   └── generator         // 代码生成
└── infra
    └── docker            // docker-compose
```

### 4.3 前端分层
```
nova-admin-frontend
├── src
│   ├── api               // 按模块拆分的请求函数
│   ├── assets
│   ├── components        // 通用业务组件
│   ├── hooks             // 自定义 Hooks
│   ├── layouts           // AdminLayout + BlankLayout
│   ├── pages             // 页面
│   │   ├── login
│   │   ├── dashboard
│   │   ├── system        // user/role/menu/dept/dict/log
│   │   ├── infra         // file/job
│   │   └── generator
│   ├── router            // 路由表 + 权限守卫
│   ├── stores            // Zustand
│   ├── types             // 全局类型
│   ├── utils             // request / storage / format
│   ├── constants         // 常量
│   ├── locales           // i18n
│   ├── App.tsx
│   └── main.tsx
├── public
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
└── package.json
```

### 4.4 数据访问层
统一使用 **MyBatis-Plus**，覆盖以下场景：

| 场景 | 实现方式 |
| --- | --- |
| 单表 CRUD | `BaseMapper<T>` / `IService<T>` |
| 分页查询 | `MybatisPlusInterceptor` + `PaginationInnerInterceptor` |
| 动态条件 | `LambdaQueryWrapper<T>` 链式拼接 |
| 复杂 SQL/多表 Join/报表 | XML Mapper 或 `@Select` 注解 + 动态 SQL |
| 逻辑删除 | `@TableLogic` |
| 自动填充 | `MetaObjectHandler`（create_by/update_by 等） |
| 数据权限 | 自定义 `DataScopeInnerInterceptor` 改写 BoundSql |

> 单数据源，无 dynamic-datasource。如未来需要多数据源，会在 `application-xxx.yml` 配置多套 DataSource Bean，由 `@DS` 注解切换。

### 4.5 关键流程

**登录流程**
```
1. 前端 /login?captchaEnabled=true → 后端 /auth/captcha 获取图形验证码
2. POST /auth/login {username, password, captchaKey, captchaCode}
3. 后端校验 captcha（Redis）→ 校验用户/密码（BCrypt）→ 加载权限
4. 生成 access_token (JWT, 2h) + refresh_token (Redis, 7d)
5. 前端保存 token，axios 拦截器自动附加 Authorization
6. 路由守卫基于角色生成可访问菜单
```

**请求鉴权流程**
```
1. JwtAuthFilter 解析 token → 校验 Redis 黑名单 → 加载 UserDetails
2. AuthorizationFilter 校验接口权限（@PreAuthorize + antMatchers）
3. Controller 执行业务
4. MyBatis 数据权限拦截器：根据 @DataScope 注解 + 当前用户角色 → 拼接 SQL WHERE 条件
5. @Log 切面：记录操作日志
```

**数据权限拦截器**
```
1. Mapper 方法含 @DataScope(deptAlias = "d", userAlias = "u")
2. 拦截器从 ThreadLocal 取出当前用户角色
3. 按角色 dataScope 枚举拼 WHERE：
   - 1 全部: 不拼
   - 2 本部门及下级: d.id IN (dept_id + all_children)
   - 3 本部门: d.id = 当前部门
   - 4 本人及下级: u.id = 当前用户 OR u.leader = 当前用户
   - 5 本人: u.id = 当前用户
4. 改写 BoundSql → 执行
```

---

## 五、数据库设计（核心表）

> 完整 DDL 在 `nova-admin-backend/sql/init.sql`，命名规范 `sys_`（系统表）/ `gen_`（代码生成）。

| 表 | 说明 | 关键字段 |
| --- | --- | --- |
| `sys_user` | 用户 | id, username, password, nickname, dept_id, status, email, phone, avatar |
| `sys_role` | 角色 | id, name, code, sort, data_scope, status |
| `sys_menu` | 菜单/权限 | id, parent_id, name, type(M/C/F), perms, path, component, icon, sort |
| `sys_dept` | 部门 | id, parent_id, name, leader, phone, sort, status |
| `sys_user_role` | 用户角色关联 | user_id, role_id |
| `sys_role_menu` | 角色菜单关联 | role_id, menu_id |
| `sys_role_dept` | 角色自定义部门 | role_id, dept_id |
| `sys_dict_type` | 字典类型 | id, type, name, status |
| `sys_dict_data` | 字典数据 | id, sort, label, value, type, status |
| `sys_operation_log` | 操作日志 | id, module, action, request_method, request_url, java_method, java_args, user_id, ip, cost, status, error_msg |
| `sys_login_log` | 登录日志 | id, username, ip, ua, os, browser, status, msg |
| `sys_file` | 文件 | id, name, url, size, type, bucket |
| `sys_job` | 定时任务 | id, name, cron, handler, status, next_time |
| `sys_job_log` | 任务日志 | id, job_id, start_time, end_time, status, error |
| `gen_table` | 生成表配置 | id, table_name, class_name, tpl_category |
| `gen_table_column` | 字段配置 | id, table_id, column_name, java_type, java_field, is_list, is_query, is_required |

所有表共字段：`create_by, create_time, update_by, update_time, deleted(0/1)`，由 MyBatis-Plus `@TableLogic` 与 MetaObjectHandler 自动填充。

---

## 六、分阶段开发计划

> 每完成一个 Phase，会暂停 → 输出功能说明 → 等待用户确认 → `git add . && git commit -m "feat(<scope>): <message>"`。
> 默认分支：`master`。

### Phase 0 — 项目初始化
- Monorepo 骨架 + `.gitignore` + `README.md` + `docker-compose.yml`（PG/Redis/MinIO）
- 后端：Spring Boot 4.1.0 初始化、统一响应、全局异常、跨域、MyBatis-Plus 配置、jOOQ 配置、Redis 配置、OpenAPI、Spring Security 基础（白名单）
- 前端：Vite 8 + React 19 + TS 7.0 + AntD 6 + Tailwind 4 + Zustand + TanStack Query 初始化、AdminLayout、登录页静态骨架、Axios 实例 + 拦截器、路由守卫、ESLint/Prettier

### Phase 1 — 认证模块
- 图形验证码（`/auth/captcha`）、登录、注销、刷新 token、获取当前用户信息
- BCrypt 密码校验、Redis 黑名单、登录失败计数

### Phase 2 — 部门管理
- 部门树 CRUD、负责人、状态、级联选择器

### Phase 3 — 用户管理
- 用户 CRUD、分配角色、分配部门、密码重置、状态切换、导入导出、用户列表 + 部门树联动

### Phase 4 — 角色管理
- 角色 CRUD、分配菜单、分配数据权限、分配部门

### Phase 5 — 菜单/权限管理
- 树形菜单 CRUD、目录/菜单/按钮三级、权限标识 `perms`、图标选择器

### Phase 6 — 数据权限
- `@DataScope` 注解 + MyBatis 拦截器
- 用户列表/部门列表等接口接入数据权限

### Phase 7 — 字典管理
- 字典类型/字典数据 CRUD、`DictService` 缓存预热、`useDict` Hook

### Phase 8 — 操作日志 + 登录日志
- `@Log` 注解 + AOP 切面、SpEL 解析
- 登录日志记录与查询、清空

### Phase 9 — 文件存储
- 文件上传（本地默认、MinIO 可选）、文件管理页

### Phase 10 — 定时任务
- `sys_job` CRUD、CRON 表达式生成器、任务执行、任务日志

### Phase 11 — 代码生成器
- 表导入、字段配置、预览、生成代码并提供下载

### Phase 12 — 国际化与监控
- i18n 中英双语切换
- 在线用户、缓存监控、Actuator 健康

### Phase 13 — 优化与文档
- 接口文档完善、Docker 镜像构建脚本、部署文档、CHANGELOG

---

## 七、交付物清单
- 后端：可运行的 Spring Boot 服务 + OpenAPI 文档
- 前端：可运行的 React SPA
- 数据库：完整 DDL 与种子数据 SQL
- Docker Compose：一键起 PG/Redis/MinIO
- 文档：设计文档、API 文档、部署文档、开发规范
