# 后端 Java 代码风格规范

> 适用范围：`nova-admin-backend/src/**`
> 强制级别：所有条目均为 **error 级**。

## 1. 格式化

| 设置 | 值 |
|---|---|
| 缩进 | 4 空格（禁止 Tab） |
| 编码 | UTF-8 |
| 行尾 | LF |
| 文件末尾 | 换行 |
| 尾随空格 | 禁止 |
| 行宽 | 建议 ≤ 120 字符 |

## 2. 命名约定

### 2.1 类命名

| 类型 | 命名规则 | 示例 |
|---|---|---|
| 实体 | `SysXxx`（`entity` 包） | `SysUser`、`SysDictType` |
| DTO/请求体 | `XxxDTO` / `XxxRequest` / `XxxCreateRequest` / `XxxUpdateRequest` | `UserDTO`、`UserCreateRequest` |
| 分页查询 | `XxxPageQuery` | `UserPageQuery` |
| Controller | `XxxController` | `UserController` |
| Service 接口 | `XxxService` | `UserService` |
| Service 实现 | `XxxServiceImpl`（`impl` 子包） | `UserServiceImpl` |
| Mapper | `XxxMapper` | `UserMapper` |
| 枚举 | `XxxEnum` | `StatusEnum` |

### 2.2 数据库表名

- 格式：`sys_xxx`（snake_case，`sys_` 前缀）
- 实体注解：`@TableName("sys_xxx")`

### 2.3 字段与变量

- 实例变量/局部变量/方法：camelCase
- 常量：`UPPER_SNAKE_CASE`（`static final`）
- 枚举值：`UPPER_SNAKE_CASE`
- 包名：全小写，无下划线

## 3. Lombok 约束

**必须使用 Lombok**，禁止手写 getter/setter/构造器样板：

```java
// ✅ 正确
@Data
@TableName("sys_user")
public class SysUser extends BaseDO {
    private String username;
    private String nickname;
}

// ❌ 禁止手写
public String getUsername() { return username; }
public void setUsername(String username) { this.username = username; }
```

| 注解 | 用途 |
|---|---|
| `@Data` | getter + setter + toString + equals + hashCode |
| `@Builder` | 构建器（与 `@Data` 同用时加 `@AllArgsConstructor` + `@NoArgsConstructor`） |
| `@Slf4j` | 注入 `log` 字段，禁止手写 `LoggerFactory.getLogger(...)` |
| `@RequiredArgsConstructor` | 构造器注入（配合 `final` 字段） |

## 4. MapStruct 约束

**所有 Entity ↔ DTO 转换使用 MapStruct**，禁止手写 `BeanUtils.copyProperties` 或逐字段赋值：

```java
// ✅ 正确
@Mapper(componentModel = "spring")
public interface UserConverter {
    UserDTO toDTO(SysUser entity);
    SysUser toEntity(UserCreateRequest request);
    List<UserDTO> toDTOList(List<SysUser> entities);
}

// ❌ 禁止
UserDTO dto = new UserDTO();
BeanUtils.copyProperties(user, dto);
```

## 5. 注释与文档

- 公开 API 方法（Controller）必须有 springdoc 注解（见 [api-contract.md](./api-contract.md)）
- 业务逻辑复杂处加行内注释，说明 **why**，不说 what
- 禁止无意义注释（如 `// 获取用户列表`、`// return result`）
- 禁止注释掉的代码提交（直接删除）

### 5.1 雪花 ID 序列化

对外 JSON 响应中的雪花 ID 不得输出为 JSON number，避免 JavaScript 精度丢失。`Long` 类型的
`id`、关联 ID 以及 ID 集合分别使用 `@JsonSerialize(using = ToStringSerializer.class)` 或
`@JsonSerialize(contentUsing = ToStringSerializer.class)`；Controller 返回新建 ID 时使用
`R<String>`。请求参数仍可保留 `Long`，前端 ID 类型必须为 `string`。

## 6. 依赖注入

使用**构造器注入**（`@RequiredArgsConstructor` + `final` 字段），不用 `@Autowired` 字段注入：

```java
// ✅ 正确
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserMapper userMapper;
    private final UserConverter userConverter;
}

// ❌ 禁止
@Autowired
private UserMapper userMapper;
```

## 7. 异常处理

- 业务异常统一抛 `BizException`（携带 `ResultCode`），由 `GlobalExceptionHandler` 集中处理
- 禁止在 Controller / Service 里 `try-catch` 后返回 `null` 或吞异常
- 禁止直接返回 HTTP 状态码，统一通过 `R<T>` 包装

```java
// ✅ 正确
if (user == null) {
    throw new BizException(ResultCode.USER_NOT_FOUND);
}

// ❌ 禁止
if (user == null) {
    return null;
}
```
