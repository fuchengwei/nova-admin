# 通知实时推送与入口视觉优化设计

## 目标

- 消息发布后，在线接收用户的通知角标和通知面板立即更新，无需刷新页面。
- 支持同一用户的多个浏览器标签页和多个在线会话同时收到消息。
- 将通知入口从裸铃铛调整为与现有后台头部协调的“安静面板”样式。
- 不新增 WebSocket 或其他第三方依赖，复用现有 SSE 会话事件连接。

## 范围

- 扩展现有 `/auth/session-events` SSE 事件协议，新增 `notification-created` 事件。
- SSE 订阅同时按 access JTI 和用户 ID 管理连接。
- 消息事务提交后，按收件用户推送通知事件。
- 前端收到事件后刷新 `['notifications', 'summary']` 查询缓存。
- 优化通知铃铛、未读角标、Popover 标题和消息项的视觉层级。

本次不包含消息撤回、外部渠道推送、离线推送、Web Push、消息分页接口改造和通知中心独立页面。

## 方案

复用现有 `AuthSessionEventService` 和 `useSessionEvents`。后端订阅时把同一 `SseEmitter` 登记到 `jti -> emitters` 与 `userId -> emitters` 两个索引中。会话撤销继续按 JTI 精确关闭连接，通知事件按用户 ID 广播到该用户全部在线连接。

消息发布服务先在当前事务中创建消息主记录和收件记录，然后通过事务提交后的事件监听器调用 SSE 推送。这样数据库回滚时不会产生前端已收到但数据库不存在的假通知。

前端由 `AdminLayout` 的现有 SSE hook 接收事件，收到 `notification-created` 后使通知摘要查询失效并立即重新请求。已有的会话撤销和权限刷新行为保持不变，断线重连沿用 3 秒退避。

## 数据流

```text
NotificationService.publish
  -> sys_message / sys_message_recipient 写入
  -> AFTER_COMMIT NotificationCreatedEvent
  -> AuthSessionEventService.notifyUser(userId)
  -> SSE event: notification-created
  -> useSessionEvents callback
  -> invalidateQueries(['notifications', 'summary'])
  -> Badge / Popover 更新
```

事件数据只传递轻量标记和消息 ID，不把完整消息正文放进 SSE。前端收到事件后重新读取摘要接口，确保已读状态、排序和权限逻辑仍以服务端为准。

## 视觉设计

- 入口：40px 浅灰背景、圆角 10px、深灰铃铛图标，悬停时使用主题主色的浅色背景。
- 角标：红色紧凑圆角数字，最多显示 `99+`，与图标右上角保持固定偏移。
- 面板：白色浮层、12px 圆角、轻阴影，宽度在桌面端约 360px，移动端不超过视口减 32px。
- 未读项：浅蓝背景和蓝色状态点；已读项保持白底但保留清晰分隔。
- 标题行：左侧“通知”，右侧“全部已读”，不再使用过大的留白。
- 支持键盘焦点和 `prefers-reduced-motion`，不增加持续动画。

## 错误处理

- SSE 连接失败、非事件流响应或 401/403：沿用现有重连和会话失效处理。
- 单个连接发送失败：移除失效连接，不影响同一用户的其他连接和消息落库。
- 通知摘要刷新失败：保留当前缓存，面板显示现有加载失败与重试状态。
- 事务回滚：不发送 `notification-created` 事件。

## 测试

- 后端单元测试：通知事务提交后发布事件；空连接集合不报错；同一用户多连接全部发送；发送失败连接被清理。
- 后端现有通知发布测试继续覆盖 ALL、ROLE、USER 收件人解析。
- 前端测试或构建验证：SSE 事件解析不影响已有撤销/权限事件；通知事件使摘要查询失效；TypeScript 检查和生产构建通过。
- 手动验证：两个标签页登录同一用户，在一个页面发布消息，另一个页面角标和面板在无需刷新情况下更新。
