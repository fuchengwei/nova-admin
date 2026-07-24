# 前端 ProComponents 使用规范

> 适用范围：`nova-admin-frontend/src/**` 所有页面开发（新建与重构）。
> **所有条目均为 error 级，违反视为错误。**

## 1. 核心原则

中后台系统的页面（列表、表单、详情、仪表盘）高度同质化。直接用 `<Table>`/`<Form>`/`<Modal>` 拼装会产生大量重复代码，且难以统一风格。

**凡有「数据 + 增删改查 + 分页/搜索」语义的页面，一律优先 ProComponents，不要先想基础组件。**

四条原则：
1. **默认优先**：新建/重构页面先从 ProComponents 选组件
2. **充分利用封装**：用 `request`、`valueEnum`/`valueType`、`ProFormDependency` 等高级特性，不手写等效逻辑
3. **必要时回落**：仅 ProComponents 无法覆盖时（纯展示元件、特殊交互）才用基础组件
4. **版本锁定**：`@ant-design/pro-components@^3`（antd v6 兼容版本线）；**禁止 2.x**

## 2. 组件选型决策表

| 业务场景 | 首选组件 | 禁止替代 |
|---|---|---|
| 列表 + 查询条件 + 分页 + 工具栏 | `ProTable` | ❌ `<Table>` + 手写分页 |
| 弹窗/抽屉表单（新增/编辑） | `ModalForm` / `DrawerForm` | ❌ `<Modal>` + `<Form>` |
| 独立查询表单 | `QueryFilter` | ❌ `<Form>` 手写布局 |
| 分步操作 | `StepsForm` | ❌ 手写 steps + 多个 Form |
| 只读对象详情展示 | `ProDescriptions` | ❌ `<Descriptions>` 手工罗列 |
| 仪表盘统计卡片 | `StatisticCard` / `ProCard` | — |
| 页面骨架/布局/卡片容器 | `ProLayout` / `PageContainer` / `ProCard` | ❌ 自建薄封装容器 |
| 无业务语义的展示元件（Button、Tag、message 等） | `antd` 基础组件 | — |
| 高度定制的可视化/图表/特殊交互 | `antd` + 自定义 / 包裹在 `ProCard` 内 | — |

## 3. ProTable

### 3.1 数据请求（`request`）

列表数据**必须**通过 `request` prop 管理，禁止在外部用 `useQuery` 拉取再传给 `dataSource`。

```tsx
<ProTable<UserRecord>
  rowKey="id"
  columns={columns}
  request={async (params) => {
    const res = await getUserPage({
      current: params.current ?? 1,
      size: params.pageSize ?? 10,
      username: params.username,
      status: params.status,
    });
    if (res.code !== 0) return { data: [], success: false, total: 0 };
    return { data: res.data.records, success: true, total: res.data.total };
  }}
  pagination={{ pageSize: 10, showSizeChanger: true }}
  search={{ labelWidth: 'auto' }}
  options={{ reload: true, density: true, setting: true }}
  toolBarRender={() => [
    <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
      {t('user.addUser')}
    </Button>,
  ]}
/>
```

### 3.2 actionRef（刷新）

必须声明 `actionRef`，写操作成功后 `actionRef.current?.reload()`。禁止通过修改外部 state 触发重渲染来刷新表格。

```tsx
const actionRef = useRef<ActionType>(null);
// 写操作成功后：
actionRef.current?.reload();
```

### 3.3 列定义（`ProColumns`）

```tsx
const columns: ProColumns<UserRecord>[] = [
  {
    title: t('user.username'),
    dataIndex: 'username',
    ellipsis: true,
  },
  {
    title: t('user.status'),
    dataIndex: 'status',
    valueType: 'select',        // 自动生成搜索下拉
    valueEnum: {                // 同时驱动搜索与渲染
      1: { text: t('common.enabled'),  status: 'Success' },
      0: { text: t('common.disabled'), status: 'Error' },
    },
  },
  {
    title: t('user.createTime'),
    dataIndex: 'createTime',
    valueType: 'dateTime',      // 禁止手写 dayjs 格式化
    search: false,              // 不参与搜索
  },
  {
    title: t('common.action'),
    valueType: 'option',        // 操作列固定用 option
    key: 'option',
    fixed: 'right',
    width: 160,
    render: (_, record) => [
      <Button key="edit" type="link" size="small" icon={<EditOutlined />}
        onClick={() => openEdit(record)}>
        {t('common.edit')}
      </Button>,
      <Popconfirm key="del" title={t('common.deleteConfirm')}
        onConfirm={() => deleteMutation.mutate(record.id)}
        okText={t('common.confirm')} cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}>
        <Button type="link" size="small" danger icon={<DeleteOutlined />}>
          {t('common.delete')}
        </Button>
      </Popconfirm>,
    ],
  },
];
```

**列定义关键 API**：

| 属性 | 用途 |
|---|---|
| `valueType` | `select` / `dateTime` / `date` / `digit` / `money` / `textarea` / `progress` 等，决定搜索框与渲染 |
| `valueEnum` | 枚举映射，同时驱动搜索下拉与单元格渲染 |
| `search: false` | 彻底关闭该列搜索 |
| `hideInSearch` | 仅在搜索区隐藏 |
| `hideInTable` | 仅在表格隐藏（仍参与搜索/表单） |
| `ellipsis: true` | 文字超长时省略 |
| `fixed: 'right'` | 操作列固定在右侧 |

**列定义较长（>6 列）时**，提取到同目录 `columns.tsx`，保持 `index.tsx` 简洁。

## 4. ProForm 系列

### 4.1 ModalForm（弹窗表单，最常用）

新增/编辑**共用一个** `ModalForm`，通过 `editing` 是否为 `null` 区分模式：

```tsx
const [editing, setEditing] = useState<UserRecord | null>(null);
const [modalOpen, setModalOpen] = useState(false);

// 打开新增
const openAdd = () => { setEditing(null); setModalOpen(true); };
// 打开编辑
const openEdit = (record: UserRecord) => { setEditing(record); setModalOpen(true); };

<ModalForm<UserRecord>
  title={editing ? t('user.editUser') : t('user.addUser')}
  open={modalOpen}
  onOpenChange={(open) => {
    setModalOpen(open);
    if (!open) setEditing(null);  // 关闭时清空
  }}
  width={520}
  layout="vertical"
  initialValues={editing ?? { status: 1 }}   // 编辑时回填，新增时给默认值
  onFinish={async (values) => {
    const res = editing
      ? await updateUser({ id: editing.id, ...values })
      : await createUser(values);
    if (res.code !== 0) { message.error(res.msg || t('common.error')); return false; }
    message.success(editing ? t('common.updateSuccess') : t('common.createSuccess'));
    actionRef.current?.reload();
    return true;   // 返回 true 自动关闭弹窗
  }}
>
  <ProFormText
    name="username"
    label={t('user.username')}
    rules={[{ required: true, message: t('user.usernameRequired') }]}
  />
  <ProFormText.Password name="password" label={t('user.password')} />
  <ProFormSelect
    name="status"
    label={t('user.status')}
    valueEnum={{ 1: t('common.enabled'), 0: t('common.disabled') }}
  />
  <ProFormText name="email" label={t('user.email')} rules={[{ type: 'email' }]} />
</ModalForm>
```

**`onFinish` 约定**：
- 返回 `false` → 保持弹窗打开（用于展示错误）
- 返回 `true` → 自动关闭弹窗
- 禁止在外部手动 `setModalOpen(false)` 来模拟提交关闭

### 4.1.1 弹窗表单布局密度

**弹窗表单字段必须使用两列网格布局，禁止一个字段独占一行平铺。**

用 Tailwind 的 `grid grid-cols-2 gap-x-4` 包裹所有 ProForm 字段：

```tsx
<ModalForm width={640} layout="vertical" ...>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
    <ProFormText name="name" label={t('user.name')} />
    <ProFormText name="email" label={t('user.email')} />
    <ProFormRadio.Group name="status" label={t('user.status')} options={[...]} />
    <ProFormTreeSelect name="deptId" label={t('user.dept')} ... />
  </div>
</ModalForm>
```

**说明**：
- 弹窗宽度搭配 `640px`（字段较少时可用 `520px`）
- `ProFormDependency` 或 `Form.Item noStyle shouldUpdate` 的条件字段放入 `grid` 内，条件隐藏时自然占位消失，不影响布局
- 需要全宽的字段（如长文本域、树选择较宽时）加 `className="col-span-2"`
- 参考实现：[`UserFormModal.tsx`](../../nova-admin-frontend/src/pages/system/user/components/UserFormModal.tsx)、[`src/pages/system/menu/index.tsx`](../../nova-admin-frontend/src/pages/system/menu/index.tsx)

### 4.2 常用 ProForm 字段组件

| 组件 | 适用场景 |
|---|---|
| `ProFormText` | 单行文本 |
| `ProFormText.Password` | 密码输入 |
| `ProFormTextArea` | 多行文本 |
| `ProFormDigit` | 数字输入（含 min/max/精度） |
| `ProFormSelect` | 下拉选择（支持 `valueEnum` / `options` / `request`） |
| `ProFormRadio.Group` | 单选组 |
| `ProFormCheckbox.Group` | 多选组 |
| `ProFormSwitch` | 开关 |
| `ProFormDatePicker` | 日期选择 |
| `ProFormDateTimePicker` | 日期时间选择 |
| `ProFormDateRangePicker` | 日期范围 |
| `ProFormTreeSelect` | 树形选择（部门、菜单等） |
| `ProFormCascader` | 级联选择 |
| `ProFormUploadButton` | 文件上传按钮 |

### 4.3 表单项联动（ProFormDependency）

```tsx
<ProFormRadio.Group name="menuType" label={t('menu.menuType')} options={[...]} />
<ProFormDependency name={['menuType']}>
  {({ menuType }) =>
    menuType !== 'button' ? (
      <ProFormText name="path" label={t('menu.path')} />
    ) : null
  }
</ProFormDependency>
```

### 4.4 其它表单形态

| 组件 | 适用场景 |
|---|---|
| `DrawerForm` | 右侧抽屉式表单，适合宽表单/详情编辑 |
| `QueryFilter` | 独立的高级查询条（放在 `ProTable` 之外时使用） |
| `StepsForm` | 分步表单（定时任务配置、代码生成向导等） |

`DrawerForm` 与 `ModalForm` API 基本一致，主要差异：`drawerProps` 替代 `modalProps`，适合字段较多的编辑场景。

## 5. ProList / ProDescriptions / ProCard

### 5.1 ProList（轻量卡片列表）

适合卡片流、订阅式、少交互的列表，**不适合带分页的管理表格**（用 `ProTable`）。

```tsx
<ProList<DatasetItem>
  dataSource={list}
  rowKey="id"
  metas={{
    title: { dataIndex: 'name' },
    description: { dataIndex: 'desc' },
    extra: { render: (_, r) => <Tag>{r.type}</Tag> },
    actions: {
      render: (_, r) => [
        <a key="open" onClick={() => open(r)}>{t('common.open')}</a>,
      ],
    },
  }}
/>
```

### 5.2 ProDescriptions（只读详情展示）

替代手写 `<Descriptions>`，支持 `valueType` / `valueEnum`：

```tsx
<ProDescriptions<ServerInfo>
  column={2}
  dataSource={server}
  columns={[
    { title: t('monitor.computerName'), dataIndex: 'computerName' },
    { title: t('monitor.computerIp'),   dataIndex: 'computerIp' },
    { title: t('monitor.cpuUsed'),      dataIndex: 'cpuUsed', valueType: 'progress' },
    { title: t('monitor.osName'),       dataIndex: 'osName' },
  ]}
/>
```

### 5.3 ProCard / StatisticCard（仪表盘、容器）

```tsx
<ProCard gutter={[16, 16]} wrap>
  <StatisticCard
    colSpan={{ xs: 24, sm: 12, lg: 6 }}
    title={t('dashboard.users')}
    statistic={{ value: stats.userCount, icon: <UserOutlined /> }}
  />
  <StatisticCard
    colSpan={{ xs: 24, sm: 12, lg: 6 }}
    title={t('dashboard.activeToday')}
    statistic={{ value: stats.activeCount, trend: { value: 12.3, up: true } }}
  />
</ProCard>
```

## 6. 何时回落基础组件

**允许直接使用 `antd` 基础组件**：
- 无业务语义的交互元件：`Button`、`Tag`、`Popconfirm`、`message`/`notification`、`Tooltip`、`Space`、`Typography`、`Upload`、`Spin`、`Result`、`Empty`
- ProComponents 未覆盖的专用交互：`Tree`（自定义节点）、`Transfer`、富文本、图表
- 布局原子：`Flex`、`Grid`、`ConfigProvider`

**典型反例 → 正例**：

| ❌ 反例 | ✅ 正例 |
|---|---|
| `<Table>` + `useState` 分页 + 手写查询表单 | `ProTable` |
| `<Form>` + `<Modal visible>` + `useEffect` 回填 | `ModalForm` + `initialValues` |
| `<Descriptions>` 逐字段手工罗列 | `ProDescriptions` |
| 自建页面容器组件（薄封装） | `PageContainer` / `ProCard` |

## 7. 代码结构约定

```
src/
├── api/                        # 接口函数（getUserPage / createUser ...）
├── types/                      # 领域类型（UserRecord / UserCreateRequest ...）
└── pages/
    └── system/
        └── user/
            ├── index.tsx       # 页面主体：ProTable + ModalForm + actionRef
            └── components/
                ├── columns.tsx # （可选）列较多时抽取，保持 index 简洁
                └── UserFormModal.tsx  # （可选）表单复杂时独立为组件
```

- 列表数据由 `ProTable.request` 管理；写操作经 `useMutation`，成功后 `actionRef.current?.reload()`
- 列定义与 `valueEnum` 较长时抽取到 `columns.tsx`，避免单文件过长
- 统一使用 `src/utils/request.ts`、`react-i18next`、`zustand`，不引入额外请求库

## 8. 参考实现：用户管理页骨架

完整参考见 [`src/pages/system/user/index.tsx`](../../nova-admin-frontend/src/pages/system/user/index.tsx)。要点：

1. `const actionRef = useRef<ActionType>(null)` 持有表格实例
2. `ProTable.request` 调 `getUserPage`，把 `R<PageResult<T>>` 转成 `{ data, success, total }`
3. `columns` 用 `valueEnum` 描述状态，`valueType: 'option'` + `fixed: 'right'` 放操作列
4. 新增/编辑共用一个 `ModalForm`，靠 `editing` 是否为 `null` 区分，`initialValues` 回填
5. 删除用 `Popconfirm` + `useMutation`，成功后 `reload()`

## 9. Code Review 检查清单

提交涉及页面的 PR 时逐项核对：

- [ ] 列表页使用 `ProTable`？（非 `<Table>` + 手写分页）
- [ ] 弹窗/抽屉表单使用 `ModalForm` / `DrawerForm`？（非 `<Modal>` + `<Form>`）
- [ ] 状态/枚举列使用 `valueEnum`？（非手写 `render` 重复枚举）
- [ ] 时间列使用 `valueType: 'dateTime'`？（非手写 `dayjs` 格式化）
- [ ] `actionRef` 已声明且写操作后调用 `reload()`？
- [ ] `ModalForm.onFinish` 失败返回 `false`、成功返回 `true`？
- [ ] 列定义较长时已提取到 `columns.tsx`？
- [ ] 列表数据由 `ProTable.request` 管理，未与 `useQuery` 重复拉取？
- [ ] 仅在 ProComponents 覆盖不到处使用基础组件？
- [ ] 类型通过 `tsc --noEmit`，lint 无新增错误？
