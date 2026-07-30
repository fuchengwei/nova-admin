# API 接口契约规范

> 适用范围：`nova-admin-backend` 所有 Controller 与前端 `src/api/` 对应层。

## 1. 统一响应格式

所有 Controller 接口**必须**返回 `R<T>`：

```java
// ✅ 正确
@GetMapping("/{id}")
public R<UserDTO> getById(@PathVariable Long id) {
    return R.ok(userService.getById(id));
}

@PostMapping
public R<Void> create(@Valid @RequestBody UserCreateRequest request) {
    userService.create(request);
    return R.ok();
}

// ❌ 禁止直接返回实体或裸数据
@GetMapping("/{id}")
public SysUser getById(@PathVariable Long id) { ... }
```

`R<T>` 结构：

```json
{
  "code": 0,        // 0 = 成功，非 0 = 业务错误码
  "msg": "success",
  "data": { ... }   // 成功时的业务数据，失败时可为 null
}
```

### 1.1 雪花 ID 响应约定

所有雪花 ID 在 JSON 响应中必须是字符串，不能返回 JSON number。适用字段包括实体/DTO 的
`id`、`parentId`、`userId`、`deptId`、`roleId`、`menuId`、`typeId` 及 ID 数组；创建接口返回
新 ID 时使用 `R<String>`。前端对应类型统一为 `string`，路径参数和请求体仍可传字符串，由后端
转换为 `Long`。分页数量、文件大小和耗时等普通数值保持 number。

## 2. 分页规范

请求参数继承 `PageQuery`：

```java
@Data
public class UserPageQuery extends PageQuery {
    private String username;
    private Integer status;
}
// PageQuery 已包含 current（页码，从 1 开始）、size（每页条数）
```

响应使用 `PageResult<T>`：

```java
return R.ok(PageResult.of(iPage));
// 转换为：{ records: [...], total: 100, current: 1, size: 10 }
```

前端 `ProTable.request` 约定消费此格式：

```tsx
const res = await getUserPage(params);
return { data: res.data.records, success: true, total: res.data.total };
```

## 3. URL 设计规范

| 操作 | HTTP 方法 | URL 示例 |
|---|---|---|
| 列表（分页） | `GET` | `/api/system/user/page` |
| 单条详情 | `GET` | `/api/system/user/{id}` |
| 新增 | `POST` | `/api/system/user` |
| 更新 | `PUT` | `/api/system/user/{id}` |
| 删除 | `DELETE` | `/api/system/user/{id}` |
| 批量删除 | `DELETE` | `/api/system/user/batch` |
| 特殊操作 | `POST` | `/api/system/user/{id}/reset-pwd` |

- URL 全部小写，多词用 `-` 连接（kebab-case）
- 资源名用复数（`/users`），本项目已统一用单数（`/user`），保持一致即可
- 版本前缀：暂不需要，统一 `/api/` 前缀

## 4. Springdoc 注解（必须）

新增或修改的 Controller 方法**必须**包含以下注解，保持 OpenAPI 文档同步：

```java
@Tag(name = "用户管理")  // 类级别
@RestController
@RequestMapping("/api/system/user")
public class UserController {

    @Operation(summary = "分页查询用户列表")
    @GetMapping("/page")
    public R<IPage<UserDTO>> page(UserPageQuery query) { ... }

    @Operation(summary = "新增用户")
    @PostMapping
    public R<Void> create(
        @Valid @RequestBody
        @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "用户创建请求")
        UserCreateRequest request
    ) { ... }

    @Operation(summary = "根据ID获取用户详情")
    @Parameter(name = "id", description = "用户ID", required = true)
    @GetMapping("/{id}")
    public R<UserDTO> getById(@PathVariable Long id) { ... }
}
```

DTO / Request 类加 `@Schema`：

```java
@Schema(description = "用户创建请求")
@Data
public class UserCreateRequest {
    @Schema(description = "用户名", example = "zhangsan")
    @NotBlank
    private String username;

    @Schema(description = "状态：1启用 0停用")
    private Integer status;
}
```

## 5. 参数校验

- 请求体使用 `@Valid` + JSR-303 注解（`@NotBlank`、`@NotNull`、`@Size`、`@Email`、`@Pattern`）
- 路径参数/查询参数加 `@Validated` 在 Controller 类上
- 校验失败由 `GlobalExceptionHandler` 统一处理，返回 `R` 格式错误信息

## 6. 错误码规范

业务错误码定义在 `ResultCode` 枚举：

```java
public enum ResultCode {
    SUCCESS(0, "success"),
    USER_NOT_FOUND(1001, "用户不存在"),
    USERNAME_DUPLICATE(1002, "用户名已存在"),
    // ...
    ;
    private final int code;
    private final String msg;
}
```

- 错误码按模块分段（1000~1999 系统模块，2000~2999 认证模块，以此类推）
- 通用错误（参数错误、无权限、服务异常）由 `GlobalExceptionHandler` 映射为标准 code

## 7. 前端 API 层约定

前端 `src/api/` 中每个模块一个文件，函数命名遵循：

```ts
// src/api/user.ts
export const getUserPage = (params: UserPageQuery) =>
  request.get<R<PageResult<UserRecord>>>('/system/user/page', { params });

export const createUser = (data: UserCreateRequest) =>
  request.post<R<void>>('/system/user', data);

export const updateUser = (data: UserUpdateRequest) =>
  request.put<R<void>>(`/system/user/${data.id}`, data);

export const deleteUser = (id: number) =>
  request.delete<R<void>>(`/system/user/${id}`);
```

- 函数名：`get`/`create`/`update`/`delete` + 资源名
- 参数类型：`XxxPageQuery` / `XxxCreateRequest` / `XxxUpdateRequest`
- 返回类型：`Promise<R<T>>`，泛型明确，禁止 `any`
