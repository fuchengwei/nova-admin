# 消息发布记录与送达明细设计

## 目标

为站内消息增加可追踪的发布管理闭环。管理员可以查看历史发布记录、发送统计和收件人已读状态，同时保留现有通知铃铛与 SSE 实时推送行为。

## 范围

- 消息发布页增加“发布消息 / 发布记录”两个页签。
- 发布记录支持分页、标题关键字、消息类型和时间范围筛选。
- 记录详情使用抽屉展示消息正文、链接、发布人和汇总统计。
- 收件明细支持按用户关键字和阅读状态分页查询。
- 记录查询、详情和收件明细仅对 `system:notification:publish` 或超级管理员开放。
- 发布成功后自动刷新记录列表，不改变收件端消息摘要接口和 SSE 事件。

## 数据模型

`sys_message` 增加可空 `publisher_id` 字段，关联发布消息的用户。系统任务生成的消息没有当前登录用户，发布人显示为系统。既有消息数据保持兼容。

统计直接基于 `sys_message_recipient` 聚合：

- `recipientCount`：收件记录总数；
- `readCount`：`read_at IS NOT NULL` 的记录数；
- `unreadCount`：`read_at IS NULL` 的记录数。

为发布人和消息时间增加查询索引；收件明细复用现有唯一键和用户状态索引。

## API

```text
GET /api/system/notification/page
GET /api/system/notification/{id}
GET /api/system/notification/{id}/recipients
```

列表参数使用项目分页约定：`current`、`pageSize`、`title`、`type`、`startTime`、`endTime`。收件明细额外支持 `keyword` 和 `read`。所有 ID 以字符串序列化。

## 后端设计

- 新增列表、详情和收件明细 DTO，查询使用 MyBatis Mapper 的参数化 SQL。
- Controller 保留 Springdoc `@Operation`、`@Parameter` 和 `@Schema` 注解。
- 发布服务新增带 `publisherId` 的调用路径；定时任务继续使用系统发布路径。
- 手动发布从 `SecurityUtils.requireUserId()` 传入发布人。
- 详情统计与收件分页使用同一条消息权限校验，避免越权读取其他消息。
- 标题、类型和时间条件均为可选；不存在的消息返回统一业务异常。

## 前端设计

- 使用 Ant Design `Tabs` 切换发布表单和记录列表。
- 记录列表使用 `ProTable.request` 管理分页和筛选。
- 详情使用 `Drawer`，顶部显示标题、发布人、发布时间和三项统计。
- 收件明细使用 `ProTable` 分页，阅读状态用 `Tag` 展示。
- 发布成功后切换到记录页并触发列表 reload。
- 中文和英文文案同步添加到 i18n。

## 测试

- Controller 方法和权限注解测试。
- Mapper/Service 聚合统计与分页参数测试。
- 发布人写入和系统消息兼容测试。
- 前端类型检查、构建和关键表单交互回归。

## 验收标准

1. 发布一条消息后，发布记录立即出现，接收人数与实际收件记录一致。
2. 收件人点击消息后，详情中的已读数和未读数正确更新。
3. 刷新页面后记录、统计和明细仍然正确。
4. 无发布权限的用户不能调用三个管理接口。
5. 原有通知铃铛、实时 SSE 和任务失败通知不受影响。
