# API 与数据契约规则

> applies_to: `nova-admin-backend/src/**/controller/**`, `nova-admin-backend/src/**/dto/**`, `nova-admin-frontend/src/api/**`

## 1. 统一响应

所有后端 Controller 返回 `R<T>`，禁止直接返回实体、裸数组或裸分页对象：

```json
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

成功使用 `R.ok(data)`，无返回值使用 `R.ok()`；失败由业务异常和全局异常处理器转换。

## 2. 雪花 ID

- HTTP JSON 中的雪花 ID 必须序列化为字符串，适用于 `id`、`parentId`、`userId`、`deptId`、`roleId`、`menuId`、`typeId` 及 ID 数组。
- Entity/DTO 的 ID 字段使用 `@JsonSerialize(using = ToStringSerializer.class)`；ID 集合使用 `contentUsing`。
- 创建接口返回新 ID 时使用 `R<String>`。
- 请求路径和请求体可以用字符串承载 ID，后端接收为 `Long` 并由框架转换。
- 前端所有 ID 类型都声明为 `string`；分页总数、文件大小、耗时和统计值仍为 `number`。

## 3. 分页

后端查询参数继承 `PageQuery`，`current` 从 1 开始；响应使用 `PageResult<T>`：

```json
{
  "records": [],
  "total": 0,
  "current": 1,
  "size": 10
}
```

前端列表使用 `ProTable.request` 将 `R<PageResult<T>>` 转换为 `{ data, success, total }`。

## 4. URL 设计

| 操作 | 方法 | 示例 |
|---|---|---|
| 分页列表 | `GET` | `/api/system/user/page` |
| 详情 | `GET` | `/api/system/user/{id}` |
| 新增 | `POST` | `/api/system/user` |
| 更新 | `PUT` | `/api/system/user` |
| 删除 | `DELETE` | `/api/system/user/{id}` |
| 特殊动作 | `POST` / `PUT` | `/api/system/user/{id}/reset-password` |

- URL 使用小写和 kebab-case；现有资源采用单数路径，新增资源保持一致。
- 后端 context-path 为 `/api`，前端 API 函数只填写 `/system/...` 等相对路径。
- 前端 API 按领域拆分文件，函数命名为 `getXxx`、`createXxx`、`updateXxx`、`deleteXxx`。

## 5. Springdoc 和参数校验

- Controller 类使用 `@Tag`；每个公开方法使用 `@Operation`，路径参数使用 `@Parameter`。
- DTO/Request 使用 `@Schema` 描述字段和示例。
- 请求体使用 `@Valid`；查询和路径参数使用 `@Validated`、`@NotBlank`、`@NotNull`、`@Size`、`@Email` 等约束。
- 校验失败和业务失败都保持 `R<T>` 响应结构。

## 6. 前端类型边界

- `src/api/` 只负责请求函数、请求参数类型和响应类型，不放页面状态或 UI 文案。
- API 返回类型必须明确使用 `Promise<R<T>>`，禁止 `any`。
- 页面负责把响应数据转换为展示需要的列、Tag 和空态；不要让 API 层依赖 React。
