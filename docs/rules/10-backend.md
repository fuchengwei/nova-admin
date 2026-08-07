# 后端开发规则

> applies_to: `nova-admin-backend/src/**`

## 1. 模块和分层

后端业务模块位于 `com.nova.admin.modules`：

| 模块 | 职责 |
|---|---|
| `auth` | 登录、验证码、Token、会话 |
| `dashboard` | 首页概览聚合 |
| `system` | 用户、角色、部门、菜单、字典、日志、通知、设置 |
| `monitor` | 服务、在线用户、缓存监控 |
| `job` | 定时任务和执行历史 |
| `infra` | 文件上传、预览和存储 |

标准调用链：

```text
Controller -> Service -> Mapper -> PostgreSQL / Redis / MinIO
```

| 层 | 允许职责 | 禁止事项 |
|---|---|---|
| Controller | 参数接收、校验、权限注解、调用 Service、返回 `R<T>` | 业务逻辑、直接调用 Mapper |
| Service | 业务规则、事务、数据权限、跨表协调 | 依赖 HTTP 对象、拼装 HTTP 响应 |
| Mapper | MyBatis-Plus 查询和必要的 XML SQL | 业务判断、调用其他 Service |
| Entity | 数据库映射和持久化字段 | 面向页面的展示逻辑 |
| DTO/Request | API 输入输出模型和校验 | ORM 注解、数据库查询 |

## 2. Java 风格

- UTF-8、LF、4 空格缩进、文件末尾换行，建议行宽不超过 120 字符。
- 类名使用 PascalCase；变量、方法使用 camelCase；常量使用 `UPPER_SNAKE_CASE`；包名全小写。
- 实体命名为 `SysXxx`，请求命名为 `XxxCreateRequest` / `XxxUpdateRequest`，分页查询命名为 `XxxPageQuery`。
- 使用 Lombok 减少样板代码：优先 `@Data`、`@RequiredArgsConstructor`、`@Builder`、`@Slf4j`。
- 依赖使用构造器注入：字段声明为 `final`，禁止字段 `@Autowired`。
- Entity 与 DTO 之间使用 MapStruct；禁止 `BeanUtils.copyProperties` 和重复手写映射。
- 复杂逻辑注释说明原因；禁止提交被注释掉的旧代码。

## 3. 数据访问

- 数据表使用 `sys_xxx` 命名，实体通过 `@TableName` 显式映射。
- 普通查询优先 Lambda Wrapper；多表 JOIN、子查询或复杂动态 SQL 才使用 XML Mapper。
- 分页统一使用 MyBatis-Plus `Page<T>` / `IPage<T>`，接口返回 `PageResult<T>`。
- 逻辑删除由 MyBatis-Plus 统一处理，业务代码不得物理删除受管数据。
- 动态 SQL 使用参数绑定和 `<if>`，禁止拼接用户输入。
- 写操作在 Service 层使用 `@Transactional`；涉及多表写入必须在同一事务内。
- 读操作不强制开启事务，只有需要一致性快照时才使用只读事务。

## 4. 数据权限和安全

- 用户、部门、角色关联数据的列表查询必须评估 `@DataScope`，不能因遗漏注解而返回越权数据。
- 权限编码使用 `module:resource:action`，接口优先使用 `@PreAuthorize`。
- 当前用户通过 `SecurityUtils` 获取，禁止在业务代码中自行解析 JWT。
- 业务异常统一抛出 `BizException`，由 `GlobalExceptionHandler` 转换为统一响应；禁止吞异常或返回 `null` 表示失败。
- 密码、Token、验证码等敏感值不得进入日志；日志内容需要使用现有脱敏工具。
- Redis 用于验证码、会话和短期缓存；缓存必须显式设置过期时间。
- 分布式锁使用 Redisson `RLock`，禁止手写 `SETNX` 锁。

## 5. 文件和外部资源

- 文件统一通过 `FileService`，业务模块不得直接操作 MinIO SDK 或本地文件系统。
- 文件预览通过 `/api/file/preview/**` 统一出口，保持权限和存储实现隔离。
- 外部资源访问失败必须转换为明确的业务异常并记录上下文，不暴露凭据和内部路径。
