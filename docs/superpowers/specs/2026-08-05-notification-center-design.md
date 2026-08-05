# 站内消息通知中心第一阶段设计

## 1. 背景与目标

Nova Admin 当前只有系统公告登录弹窗，没有按用户记录的消息中心，也没有未读状态。第一阶段增加轻量的 Header 通知入口，提供当前用户最近消息、未读数量、单条已读和全部已读能力。

本阶段只建设消息基础链路，不增加管理员发布页面，也不接入公告、权限变更、定时任务等具体消息生产事件。后续业务事件通过内部 `NotificationService` 写入消息。

## 2. 范围边界

### 包含

- 消息主表和用户收件关联表。
- 当前用户消息摘要接口：未读数量和最近 10 条。
- 单条已读和全部已读接口。
- Header 铃铛、未读 Badge、Popover 消息列表和已读操作。
- 中英文 i18n、后端单元测试和前端组件测试。

### 不包含

- 管理员发布、编辑或删除消息。
- 公告、权限变更、定时任务失败等事件接入。
- 独立消息中心菜单页、消息分页页和消息搜索。
- 轮询、SSE 或 WebSocket 实时推送。
- 消息删除、撤回、过期策略和附件。

## 3. 数据模型

### `sys_message`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 雪花 ID，主键 |
| `type` | `varchar(32)` | 稳定消息类型标识，如 `system`、`permission`、`job` |
| `title` | `varchar(200)` | 消息标题 |
| `content` | `text` | 消息正文 |
| `link` | `varchar(500)` | 可选前端路由，空值表示不跳转 |
| `create_time` | `timestamp` | 创建时间 |
| `deleted` | `smallint` | 逻辑删除标记，沿用项目约定 |

### `sys_message_recipient`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | `bigint` | 雪花 ID，主键 |
| `message_id` | `bigint` | 消息 ID |
| `user_id` | `bigint` | 接收用户 ID |
| `read_at` | `timestamp` | 已读时间，`NULL` 表示未读 |
| `create_time` | `timestamp` | 投递时间 |

约束和索引：

- `unique(message_id, user_id)` 防止同一消息重复投递。
- `index(user_id, read_at, create_time desc)` 支持未读数量和最近消息查询。
- 外键关系不依赖数据库级级联，删除行为由服务层控制，保持初始化 SQL 与现有表风格一致。
- 两张表只在 `nova-admin-backend/sql/init.sql` 创建，不增加运行时 Schema 初始化、迁移或回退代码。

消息 ID、收件记录 ID 和用户 ID 对外 JSON 统一序列化为字符串。

## 4. 后端设计

### 服务边界

新增 `NotificationService`，包含两类能力：

1. 面向当前用户的查询和已读操作，由 Controller 调用。
2. 面向未来业务事件的内部写入方法：创建消息并投递给一个或多个用户。本阶段不暴露发布 Controller。

查询服务从认证上下文获取当前用户 ID，任何查询、单条已读和全部已读都必须带用户条件，禁止通过请求参数指定目标用户。

### API

#### `GET /system/notification/summary`

返回：

```json
{
  "unreadCount": 3,
  "records": [
    {
      "id": "1001",
      "type": "system",
      "title": "系统维护通知",
      "content": "系统将于今晚维护。",
      "link": "/system/settings",
      "read": false,
      "createdAt": "2026-08-05T12:00:00"
    }
  ]
}
```

只返回当前用户最近 10 条，按投递时间倒序；未读数量统计当前用户全部未读记录，不受最近 10 条限制。

#### `PUT /system/notification/{id}/read`

按 `id` 和当前用户更新 `read_at`。已读记录重复调用保持成功且不改变首次已读时间。

#### `PUT /system/notification/read-all`

按当前用户批量更新所有 `read_at IS NULL` 的记录，返回本次更新数量。没有未读记录时返回 `0`，保持幂等。

三个接口只要求登录，不新增菜单权限；接口添加 `@Operation`、`@Parameter` 和 DTO `@Schema` 注解，统一返回 `R<T>`。

### 错误处理

- 当前用户无权访问指定消息时按资源不存在处理，不泄露其他用户消息是否存在。
- 数据库异常沿用全局异常处理器，前端保留已有通知数量和列表，不影响用户菜单及主页面加载。
- 消息内容按纯文本展示，第一阶段不引入 HTML 渲染。

## 5. 前端设计

### API 层

新增 `src/api/notification.ts`，定义 `NotificationRecord`、`NotificationSummary` 类型和三个请求方法，ID 使用 `string`。

### Header 入口

新增 `src/components/NotificationBell.tsx`，通过 `Badge` + `Popover` 提供：

- 铃铛图标和未读数量。
- 最近 10 条消息，固定最大高度并在列表内部滚动。
- 未读消息浅色背景和状态圆点，已读消息保持普通样式。
- 点击消息：先标记已读，再按 `link` 跳转；无链接时只标记已读。
- “全部已读”按钮，仅在存在未读消息时启用。
- 空状态、加载状态和请求失败提示。

`AdminLayout` 将铃铛放在语言切换与用户菜单之间。使用 TanStack Query 查询键 `['notifications', 'summary']`；已读操作成功后使该查询失效并刷新。第一阶段不设置轮询，不修改现有会话 SSE 逻辑。

所有用户可见文案同步维护 `zh.ts` 与 `en.ts`，消息类型使用稳定 key 映射到本地化文本，不直接展示后端类型字符串。

## 6. 测试与验收

### 后端

- 摘要只返回当前用户消息。
- 未读数量不受最近 10 条限制。
- 最近消息按投递时间倒序。
- 单条已读不能修改其他用户记录，重复调用幂等。
- 全部已读只更新当前用户未读记录，并正确返回更新数量。
- 内部写入方法避免重复收件记录。

### 前端

- summary 正常返回时显示 Badge 和最近消息。
- 空列表显示空状态，未读数为 0 时隐藏或不显示 Badge 数字。
- 点击未读消息触发已读并按链接导航。
- 全部已读刷新列表并清除 Badge。
- 请求失败时保留布局，不阻塞语言切换和用户菜单。
- 中文和英文文案 key 同步。

验证命令：

- 后端：`mvn -q test`
- 前端：`pnpm type-check`、`pnpm build`
- 变更检查：`git diff --check`

本阶段完成后暂停实现后续消息生产事件，等待用户审查。
