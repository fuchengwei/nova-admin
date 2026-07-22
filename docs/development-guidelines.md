# Nova Admin 前端开发规范：优先使用 ProComponents

> 适用范围：nova-admin-frontend 所有页面开发（新建与重构）。
> 关联文档：[整体设计](./plans/2026-07-22-nova-admin-design.md)

## 1. 目的与原则

中后台系统的页面（列表、表单、详情、仪表盘）高度同质化。直接基于 Ant Design 基础组件（`<Table>`、`<Form>`、`<Modal>` 等）从零拼装，会产生大量重复的请求编排、分页、列定义、表单校验代码，且各页面风格难以统一。

**ProComponents**（`@ant-design/pro-components`）是 Ant Design 官方的中后台业务组件库，对常见场景做了开箱即用的封装。本规范确立以下原则：

1. **默认优先**：新建/重构页面时，优先从 ProComponents 选取组件（`ProTable`、`ProForm`、`ProList`、`ProDescriptions`、`ProCard`、`ProLayout` 等）满足功能需求。
2. **充分利用封装能力**：使用其数据请求配置（`request`）、列定义（`columns` + `valueEnum`/`valueType`）、表单项联动（`ProFormDependency`）等高级特性，而非手写等效逻辑。
3. **必要处回落基础组件**：仅在 ProComponents 无法覆盖的场景（纯展示小元件、特殊交互、自定义可视化）使用 Ant Design 基础组件，并合理组合。
4. **兼容性已验证**：ProComponents 的 **3.x** 版本（`@ant-design/pro-components@^3`）peer 依赖为 `antd@^6.0.0`，与本项目 `antd@6.5`、`react@19` 技术栈兼容，可直接引入。**统一锁定 3.x**（当前发布形态为 beta 预发布，是官方对应 Ant Design v6 的版本线；2.x 仅支持 antd v4/v5，禁止用于本项目）。

## 2. 组件选型决策树

| 业务场景 | 首选组件 |
| --- | --- |
| 列表 + 查询条件 + 分页 + 工具栏（绝大多数管理页） | `ProTable` |
| 表单（含查询表单、弹窗表单、抽屉表单、分步表单） | `ProForm` 系列：`ProForm` / `QueryFilter` / `ModalForm` / `DrawerForm` / `StepsForm` |
| 轻量列表（卡片流、关注/订阅式、少交互） | `ProList` |
| 只读详情展示（对象属性铺开） | `ProDescriptions` |
| 页面骨架 / 布局 / 卡片容器 | `ProLayout` / `ProCard`（含 `StatisticCard`） |
| 无业务语义的展示/交互小元件（`Button`、`Tag`、`Modal`、`message`、`Tooltip`、`Space`、`Typography`、`Upload`、`Spin` 等） | 直接使用 `antd` 基础组件（ProForm 内部字段本就基于它们） |
| 高度定制的可视化 / 图表 / 特殊交互 | `antd` + 自定义，或包裹在 `ProCard` 容器中 |

**核心判据**：凡是「数据驱动 + 增删改查 + 分页/搜索」的页面，一律先想 `ProTable` + `ProForm`，不要先想 `<Table>` + `<Form>`。

## 3. ProTable 速查

### 3.1 数据请求（`request`）
`ProTable` 的 `request` 接收合并了「分页参数 + 查询表单值」的 `params`，返回 `{ data, success, total }`。本项目的接口统一返回 `R<PageResult<T>>`，转换如下：

```tsx
<ProTable<UserRecord>
  rowKey="id"
  columns={columns}
  request={async (params) => {
    const res = await getUserPage({
      current: params.current,
      size: params.pageSize,
      username: params.username,
      status: params.status,
    });
    if (res.code !== 0) return { data: [], success: false, total: 0 };
    return {
      data: res.data.records,
      success: true,
      total: res.data.total,
    };
  }}
  pagination={{ pageSize: 10 }}
  toolBarRender={() => [
    <Button key="add" type="primary" onClick={() => setModalOpen(true)}>
      {t('user.add')}
    </Button>,
  ]}
/>
```

> 说明：采用 `ProTable` 内置 `request` 后，列表数据由其内部管理，不再使用 `useQuery` 拉取表格数据；写操作（增删改）仍可用 `useMutation`，成功后在 `actionRef.current?.reload()` 刷新列表。

### 3.2 列定义
```tsx
const columns: ProColumns<UserRecord>[] = [
  { title: t('user.username'), dataIndex: 'username', ellipsis: true },
  {
    title: t('user.status'),
    dataIndex: 'status',
    valueType: 'select',
    valueEnum: {
      0: { text: t('common.enabled'), status: 'Success' },
      1: { text: t('common.disabled'), status: 'Error' },
    },
  },
  {
    title: t('user.createdAt'),
    dataIndex: 'createdAt',
    valueType: 'dateTime',
    hideInSearch: true,
  },
  {
    title: t('common.action'),
    valueType: 'option',
    key: 'option',
    render: (_, record) => [
      <a key="edit" onClick={() => openEdit(record)}>{t('common.edit')}</a>,
      <Popconfirm key="del" title={t('common.confirmDelete')} onConfirm={() => handleDelete(record.id)}>
        <a>{t('common.delete')}</a>
      </Popconfirm>,
    ],
  },
];
```
- `valueType`：`select`/`dateTime`/`date`/`digit`/`money`/`textarea`/`avatar`/`progress` 等，自动决定搜索框与渲染。
- `valueEnum`：枚举值 → 文本/标签的映射，同时驱动搜索下拉。
- `hideInSearch` / `hideInTable` / `hideInForm`：在同一列定义里控制「搜索区 / 表格 / 表单」三处的显隐。
- `search: false`：完全关闭该列搜索。
- `render`：`valueType: 'option'` 的列用于操作区。

### 3.3 关闭/定制搜索与工具条
```tsx
<ProTable
  search={{ labelWidth: 'auto' }}
  options={{ reload: true, density: true, setting: true }}
  headerTitle={t('user.title')}
  toolBarRender={...}
/>
```

## 4. ProForm 速查

### 4.1 弹窗表单（最常用）
用 `ModalForm` 承载新增/编辑，省去手写 `<Modal>` + `<Form>` + 显隐状态：

```tsx
<ModalForm<UserRecord>
  title={editing ? t('user.edit') : t('user.add')}
  open={modalOpen}
  onOpenChange={setModalOpen}
  initialValues={editing ?? {}}
  onFinish={async (values) => {
    const res = editing
      ? await updateUser(editing.id, values)
      : await createUser(values);
    if (res.code !== 0) return false;
    message.success(t('common.success'));
    actionRef.current?.reload();
    return true;
  }}
>
  <ProFormText name="username" label={t('user.username')} rules={[{ required: true }]} />
  <ProFormText.Password name="password" label={t('user.password')} />
  <ProFormSelect name="status" label={t('user.status')} valueEnum={{ 0: t('common.enabled'), 1: t('common.disabled') }} />
  <ProFormDigit name="deptId" label={t('user.dept')} />
  <ProFormText name="nickname" label={t('user.nickname')} />
  <ProFormText name="email" label={t('user.email')} rules={[{ type: 'email' }]} />
</ModalForm>
```

常用字段组件：`ProFormText`、`ProFormText.Password`、`ProFormDigit`、`ProFormSelect`、`ProFormRadio`、`ProFormDateTimePicker`、`ProFormDatePicker`、`ProFormTextArea`、`ProFormUploadButton`、`ProFormCascader`、`ProFormTreeSelect`。

### 4.2 表单项联动
```tsx
<ProFormRadio.Group name="type" label={t('common.type')} options={[...]} />
<ProFormDependency name={['type']}>
  {({ type }) => (type === 'A' ? <ProFormText name="extra" label="补充项" /> : null)}
</ProFormDependency>
```

### 4.3 其它形态
- `DrawerForm`：右侧抽屉式表单（适合宽表单 / 详情编辑）。
- `QueryFilter`：独立的高级查询条（可放在 `ProTable` 之外）。
- `StepsForm`：分步表单（如定时任务、代码生成向导）。

## 5. ProList / ProDescriptions 速查

### 5.1 ProList（轻量列表）
```tsx
<ProList<DatasetItem>
  dataSource={list}
  metas={{
    title: { dataIndex: 'name' },
    description: { dataIndex: 'desc' },
    actions: {
      render: (_, r) => [<a key="open" onClick={() => open(r)}>{t('common.open')}</a>],
    },
  }}
/>
```

### 5.2 ProDescriptions（只读详情）
```tsx
<ProDescriptions<ServerInfo>
  column={2}
  dataSource={server}
  columns={[
    { title: t('server.os'), dataIndex: 'osName' },
    { title: t('server.cpu'), dataIndex: 'cpuUsage', valueType: 'progress' },
    { title: t('server.status'), dataIndex: 'status', valueEnum: {...} },
  ]}
/>
```

### 5.3 ProCard / StatisticCard（仪表盘、容器）
```tsx
<ProCard gutter={16} wrap>
  <StatisticCard colSpan={6} title={t('dashboard.users')} statistic={{ value: stats.userCount, icon: <UserOutlined /> }} />
  <StatisticCard colSpan={6} title={t('dashboard.orders')} statistic={{ value: stats.orderCount, trend: { value: 12.3, up: true } }} />
</ProCard>
```

## 6. 何时回落基础组件（反例 vs 正例）

**允许直接使用 `antd` 基础组件的场景**
- 无业务语义的展示/交互元件：`Button`、`Tag`、`Modal`（仅做确认弹窗时）、`message`/`notification`、`Tooltip`、`Space`、`Typography`、`Upload`、`Spin`、`Result`、`Empty`、`Popconfirm`。
- ProComponents 未覆盖的专用交互（如 `Tree` 选择、`Transfer`、富文本、图表）。
- 布局原子（`Flex`、`Grid`、`ConfigProvider`）。

**不推荐（应改写为 ProComponents）**
- ❌ 用 `<Table>` + 手动 `useState` 分页 + 手写查询表单实现管理列表页 → ✅ 改用 `ProTable`。
- ❌ 用 `<Form>` + `<Modal visible>` + 一堆 `useEffect` 回填实现增改表单 → ✅ 改用 `ModalForm` + `initialValues`。
- ❌ 用 `<Descriptions>` 手工罗列对象字段 → ✅ 改用 `ProDescriptions`。

**判断口诀**：有「数据 + 增删改查 + 分页/搜索」语义 → ProComponents；纯展示/特殊交互 → 基础组件。

## 7. 代码结构约定

与现有工程保持一致，便于检索与维护：

```
src/
├─ api/            # 接口函数（getUserPage / createUser / updateUser / deleteUser ...）
├─ types/          # 领域类型（UserRecord 等）
├─ pages/
│  └─ system/
│     └─ user/
│        ├─ index.tsx        # 页面：ProTable + ModalForm + actionRef
│        └─ columns.tsx      # （可选）抽取 columns / valueEnum，保持 index 清爽
```

- 列表页由 `ProTable` 的 `request` 拉数；写操作经 `useMutation`，成功后 `actionRef.current?.reload()`。
- 列定义与枚举若较长，可抽取到同目录 `columns.tsx`，避免单文件过长。
- 仍统一使用现有 `request`（`src/utils/request.ts`）、`i18n`（`useTranslation`）、`zustand` 状态，不引入额外请求库。

## 8. 参考示例：用户管理页（ProTable + ModalForm 骨架）

完整骨架见 `src/pages/system/user/index.tsx`（已按本规范重构）。要点：

1. `actionRef = useRef<ActionType>()` 持有表格实例，写操作后 `reload()`。
2. `ProTable` 的 `request` 调用 `getUserPage`，把 `R<PageResult<T>>` 转成 `{ data, success, total }`。
3. `columns` 用 `valueEnum` 描述状态、`valueType: 'option'` 放操作按钮。
4. 新增/编辑共用一个 `ModalForm`，靠 `editing` 是否为 `null` 区分，用 `initialValues` 回填。
5. 删除用 `Popconfirm` + `useMutation`，成功 `reload()`。

## 9. Code Review 检查清单

提交涉及页面的 PR 时，逐项核对：

- [ ] 列表页是否使用了 `ProTable`（而非手写 `<Table>` + 分页）？
- [ ] 表单是否使用了 `ProForm` 系列（`ModalForm`/`DrawerForm` 等），而非手写 `<Form>` + `<Modal>`？
- [ ] 是否利用了 `valueEnum`/`valueType` 等封装特性，而非重复手写渲染/下拉？
- [ ] 列表数据是否交给 `ProTable` 的 `request` 管理，避免与 `useQuery` 重复拉数？
- [ ] 仅在 ProComponents 覆盖不到处使用 `antd` 基础组件，且组合合理？
- [ ] 是否保持了现有的 `request` / `i18n` / `zustand` 约定，未引入额外依赖？
- [ ] 类型通过 `tsc --noEmit`，lint 无新增错误？
