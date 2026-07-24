# 后端架构规范

> 适用范围：`nova-admin-backend/src/**`
> 关联文档：[api-contract.md](./api-contract.md)、[backend-java-style.md](./backend-java-style.md)

## 1. 分层职责

```
Controller  →  Service  →  Mapper  →  Database
```

| 层 | 职责 | 禁止事项 |
|---|---|---|
| Controller | 接收参数、参数校验（`@Valid`）、调用 Service、返回 `R<T>` | 写业务逻辑；直接操作 Mapper |
| Service | 业务逻辑、事务、权限校验 | 直接操作 HTTP 对象（`HttpServletRequest`） |
| Mapper | 数据访问，封装 SQL | 写业务逻辑 |
| Entity | 纯数据模型，`@TableName` 注解 | 业务方法；直接暴露给前端 |
| DTO | 传输对象，面向 API | ORM 注解 |

## 2. 包结构

```
com.nova.admin/
├── modules/
│   ├── auth/           # 登录、验证码、token 刷新
│   ├── system/         # 用户、角色、部门、菜单、字典、日志
│   ├── monitor/        # 服务器监控、在线用户、缓存监控
│   ├── job/            # 定时任务
│   ├── infra/          # 文件管理
│   └── gen/            # 代码生成
├── common/             # R<T>、PageQuery、BizException、BaseDO、ResultCode
├── config/             # Spring 配置类
└── security/           # JWT 过滤器、SecurityUtils
```

新模块必须在 `modules/` 下建子包，禁止在根包堆放文件。

## 3. MyBatis-Plus 使用规范

### 3.1 优先 LambdaQueryWrapper

```java
// ✅ 优先使用
LambdaQueryWrapper<SysUser> wrapper = new LambdaQueryWrapper<SysUser>()
    .eq(SysUser::getStatus, 1)
    .like(StringUtils.isNotBlank(query.getUsername()), SysUser::getUsername, query.getUsername())
    .orderByDesc(SysUser::getCreateTime);

// ❌ 仅复杂 SQL（多表 JOIN、子查询、动态 SQL）才用 XML
```

### 3.2 XML Mapper 规范

- 文件位置：`src/main/resources/mapper/XxxMapper.xml`
- namespace 与 Mapper 接口全限定名一致
- 使用 `<if>` 做动态条件，禁止字符串拼接 SQL

### 3.3 分页

统一使用 MyBatis-Plus 的 `Page<T>` + `IPage<T>`：

```java
Page<SysUser> page = new Page<>(query.getCurrent(), query.getSize());
IPage<SysUser> result = userMapper.selectPage(page, wrapper);
return R.ok(PageResult.of(result));
```

### 3.4 逻辑删除

实体继承 `BaseDO`，自动注入 `createTime`、`updateTime`、`deleted`（逻辑删除）。
禁止物理删除，统一通过 `removeById` / 逻辑删除字段处理。

## 4. 事务规范

- 写操作（增删改）在 Service 层加 `@Transactional`
- 读操作加 `@Transactional(readOnly = true)`
- 禁止在 Controller 加 `@Transactional`
- 涉及多表写操作的方法必须在同一事务内

## 5. 数据权限（@DataScope）

系统内置 `@DataScope` 注解 + AOP 拦截器，用于控制用户只能看到有权限的数据：

```java
@DataScope(deptAlias = "d", userAlias = "u")
List<SysUser> selectUserList(UserPageQuery query);
```

- 涉及部门/用户数据的列表查询必须评估是否需要数据权限
- 超级管理员自动跳过数据权限过滤

## 6. 安全规范

- 所有需要认证的接口通过 `SecurityConfig` 的 `HttpSecurity` 配置保护
- 角色/权限校验优先使用 Spring Security 的 `@PreAuthorize`：

```java
@PreAuthorize("hasAuthority('system:user:list')")
@GetMapping("/list")
public R<IPage<UserDTO>> list(UserPageQuery query) { ... }
```

- 权限标识格式：`module:resource:action`（如 `system:user:create`）
- 禁止在业务代码中手动解析 JWT Token，使用 `SecurityUtils` 工具类获取当前用户

## 7. Redis / 缓存规范

- 分布式锁使用 Redisson（`RLock`），禁止 `SETNX` 手写锁
- 缓存 key 格式：`nova:<module>:<resource>:<id>`
- 缓存过期时间显式设置，禁止永不过期（防内存溢出）
- 验证码、token 等短期数据走 Redis，不走数据库

## 8. 文件存储

- 文件统一通过 `FileService` 上传，不在业务代码中直接操作 MinIO SDK
- 返回给前端的文件 URL 通过 `FilePreviewController` 代理访问（权限统一控制）
