# 前端状态管理与国际化规范

> 适用范围：`nova-admin-frontend/src/**`

## 1. 客户端状态（Zustand）

### 1.1 现有 Store

| Store | 持久化 key | 用途 |
|---|---|---|
| `useUserStore` | `nova-user` | 用户信息、菜单树、权限列表、角色列表 |
| `useAppStore` | `nova-app` | 语言（locale）、主题、侧边栏折叠状态 |

### 1.2 使用约束

- 从 `@/stores/userStore` / `@/stores/appStore` 直接导入使用，不重新封装
- UI 临时状态（弹窗显隐、加载状态）用 `useState`，**不放入 store**
- 禁止在 store 里存放服务端数据（表格列表、单条记录详情），这些属于服务端状态

## 2. 服务端状态（TanStack Query）

### 2.1 使用场景划分

| 数据类型 | 使用方式 |
|---|---|
| 表格列表数据 | `ProTable` 的 `request` prop（内部管理，不用 `useQuery`） |
| 写操作（增删改） | `useMutation` |
| 非表格的数据拉取（详情、统计、下拉选项） | `useQuery` |

```tsx
// ✅ 写操作
const deleteMutation = useMutation({
  mutationFn: (id: number) => deleteUser(id),
  onSuccess: () => {
    message.success(t('user.deleteSuccess'));
    actionRef.current?.reload();
  },
});

// ✅ 非表格数据（如角色下拉列表）
const { data: roles } = useQuery({
  queryKey: ['roles', 'all'],
  queryFn: () => getRoleList(),
  select: (res) => res.data ?? [],
});

// ❌ 禁止：用 useQuery 拉取表格数据再传给 dataSource
const { data } = useQuery({ queryFn: getUserPage });
<ProTable dataSource={data?.records} />
```

### 2.2 queryKey 命名约定

```ts
['resource', 'list']          // 列表（一般不直接用，由 ProTable 管理）
['resource', 'all']           // 全量数据（如下拉选项）
['resource', id]              // 单条记录
['resource', 'stats']         // 统计数据
```

## 3. 国际化（i18n）

### 3.1 文件结构

```
src/i18n/
├── index.ts       # i18next 初始化（不改动）
├── zh.ts          # 中文翻译（默认语言）
└── en.ts          # 英文翻译
```

### 3.2 Key 命名约定

格式：`<模块>.<camelCaseKey>`

```ts
// ✅ 正确
t('user.addUser')
t('dict.typeName')
t('common.confirm')

// ❌ 禁止：下划线、大写、路径分隔
t('user.add_user')
t('user.AddUser')
t('user/addUser')
```

**`common` 模块**用于跨页面复用的通用文案：

```ts
common.confirm        // 确定
common.cancel         // 取消
common.edit           // 编辑
common.delete         // 删除
common.add            // 新增
common.save           // 保存
common.back           // 返回
common.search         // 搜索
common.reset          // 重置
common.success        // 操作成功
common.fail           // 操作失败
common.error          // 操作失败（错误回退）
```

**业务模块** key 放在对应模块下（`user.xxx`、`role.xxx`、`dict.xxx` 等）。

### 3.3 同步维护

- 新增 key 时，`zh.ts` 和 `en.ts` **同步更新**，缺任意一方均视为错误
- 删除功能时，同步删除对应 key，避免死 key 堆积
- key 顺序保持与 `zh.ts` 一致，便于 diff

### 3.4 使用方式

```tsx
import { useTranslation } from 'react-i18next';

export default function UserPage() {
  const { t } = useTranslation();

  return <Button>{t('user.addUser')}</Button>;
}
```

- 禁止直接导入语言文件取值，始终通过 `t()` 函数
- 禁止硬编码中文或其他可翻译文案

### 3.5 语言切换

通过 `useAppStore` 的 `locale` 字段驱动，切换后 `i18n.changeLanguage(locale)` 生效：

```ts
// src/stores/appStore.ts 已处理，不需要在组件里手动调用
```
