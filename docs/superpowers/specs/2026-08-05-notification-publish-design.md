# 站内消息发布设计

## 目标

为已有站内消息中心补充一个可控的管理员发布入口。发布者可以选择全部启用用户、一个或多个启用角色，或一个或多个启用用户作为收件人；后端负责重新校验状态、去重并创建收件记录。

## 范围

- 新增 `GET /system/notification/recipients` 获取启用用户和角色选项。
- 新增 `POST /system/notification/publish` 发布系统消息，返回实际投递用户数。
- 新增系统管理下的「消息发布」菜单和 `system:notification:publish` 权限，菜单数据只写入初始化 SQL。
- 前端使用单页纵向表单，接收范围切换时只保留当前类型的选项；支持标题、正文和可选站内路由。

本次不包含消息编辑、删除、撤回、定时发布、审批、实时推送和外部通知渠道。

## 规则

- `ALL` 只选取状态为启用且未逻辑删除的用户。
- `ROLE` 只使用状态为启用的角色，并投递给该角色下的启用用户。
- `USER` 只使用状态为启用的指定用户。
- 角色与用户关联造成的重复收件人只保留一条。
- 没有有效收件人时返回参数错误，不创建消息主记录。

## 验收

- 超级管理员可打开消息发布页并发布消息。
- 发布成功提示实际投递人数，Header 铃铛可看到新消息。
- 停用用户、停用角色和无效 ID 不会收到消息。
- 初始化 SQL 包含菜单和权限；应用启动不执行运行时迁移。

## 收件人解析修复

### 问题

发布消息时，`ALL`、`ROLE` 与 `USER` 三种接收范围都会提示“没有可接收消息的启用用户”。三条流程最终依赖 MyBatis-Plus 的通用 `SysUserMapper.selectList` 查询，无法将消息投递的固定筛选规则明确限定在 Mapper 层。

### 方案

- 在 `SysUserMapper` 定义三个专用查询：查询全部启用用户 ID、指定用户中的启用用户 ID、指定角色下的启用用户 ID。
- 每条查询均固定过滤 `sys_user.status = 1` 和 `sys_user.deleted = 0`；角色查询额外过滤 `sys_role.status = 1` 和 `sys_role.deleted = 0`。
- `NotificationPublishServiceImpl` 仅负责校验接收范围、去重并调用对应 Mapper 查询，不再自行串联用户、角色及关联表的通用 `selectList` 查询。
- 保持现有 API、请求参数、权限标识、错误文案和前端交互不变。

### 数据流

- `ALL`：`publish` -> `selectEnabledUserIds` -> `NotificationService.publish`。
- `USER`：`publish` -> 清理空 ID 并去重 -> `selectEnabledUserIdsByIds` -> `NotificationService.publish`。
- `ROLE`：`publish` -> 清理空 ID 并去重 -> `selectEnabledUserIdsByRoleIds` -> `NotificationService.publish`。
- 三条流程未找到收件人时均保留当前参数错误，且不会创建消息或收件记录。

### 验收补充

- 三种接收范围各自能够将消息投递给命中的启用用户。
- 停用、逻辑删除的用户和角色不会作为收件人。
- 同一用户拥有多个选定角色时，最终仅生成一条收件记录。
- 单元测试覆盖三种成功路径与无有效收件人路径。
