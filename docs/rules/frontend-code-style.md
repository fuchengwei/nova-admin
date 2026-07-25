# 前端代码风格规范

> 适用范围：`nova-admin-frontend/src/**`
> 强制级别：所有条目均为 **error 级**，提交前必须通过 `pnpm lint` 与 `tsc --noEmit`。

## 1. 格式化

遵循 `.prettierrc`，关键设置：

| 设置 | 值 |
|---|---|
| 缩进 | 2 空格 |
| 引号 | 单引号 |
| 分号 | 必须 |
| printWidth | 100 |
| trailingComma | all |
| 行尾 | LF |

提交前运行：

```bash
pnpm format   # prettier 格式化
pnpm lint     # eslint --max-warnings 0
pnpm type-check  # tsc --noEmit
```

## 2. TypeScript 约束

- **禁止 `any`**：用 `unknown` + 类型守卫，或精确建模类型
- **禁止魔法字符串/数字**：提取为常量或 `enum`
- **类型命名约定**：

| 用途 | 命名模式 | 示例 |
|---|---|---|
| 领域实体（后端返回） | `XxxRecord` | `UserRecord` |
| 创建请求体 | `XxxCreateRequest` | `UserCreateRequest` |
| 更新请求体 | `XxxUpdateRequest` | `UserUpdateRequest` |
| 分页查询参数 | `XxxPageQuery` | `UserPageQuery` |
| API 响应包装 | `R<T>` | `R<PageResult<UserRecord>>` |

- 共用类型放 `src/types/`；领域类型跟随模块 API 文件定义后 re-export

## 3. 组件规范

### 3.1 命名与文件

- 组件文件：`PascalCase.tsx`，一文件一组件
- Hook 文件：`useXxx.ts`
- 工具函数：`camelCase.ts`
- **严禁**在同一文件定义多个组件

### 3.2 目录归属

```
src/
├── components/          # 跨页面公共组件
├── pages/
│   └── system/
│       └── user/
│           ├── index.tsx              # 页面主组件
│           └── components/            # 仅服务本页面的局部组件
│               ├── UserFormModal.tsx
│               └── ResetPwdModal.tsx
├── hooks/               # 跨页面公共 hook
└── utils/               # 工具函数（tree.ts、validators.ts …）
```

**判断标准**：
- 仅某一页面使用 → `pages/<module>/components/`
- 两个及以上页面复用 → `src/components/`
- 业务逻辑抽取 → `pages/<module>/hooks/`（模块级）或 `src/hooks/`（通用）

### 3.3 文件规模限制

| 行数 | 要求 |
|---|---|
| ≤ 200 行 | ✅ 正常 |
| 201–250 行 | ⚠️ 建议拆分 |
| > 250 行 | ❌ 必须拆分 |

拆分方向：提取局部组件、抽离列定义到 `columns.tsx`、抽取逻辑到自定义 hook。

### 3.4 禁止的组件模式

- ❌ 为单纯透传 props 的薄封装新建组件（如对 `antd Switch` 的 1:1 包装）
- ❌ 页面容器自建，应使用 `ProLayout` / `ProCard` / `PageContainer`
- ❌ class 组件；使用函数组件 + hooks

### 3.5 表格/详情空值展示

- `ProTable` / `ProDescriptions` 的文本型字段，空值统一显示 `-`
- 仅 `null`、`undefined`、`''` 视为空值
- `0`、`false` **不得**视为空值
- 禁止使用 `value || '-'` 这类会误伤合法 falsy 值的写法
- 统一复用 `src/utils/display.ts`
- 详细规则与示例见 [`frontend-procomponents.md`](./frontend-procomponents.md)

## 4. Tailwind CSS 约束

### 4.1 类名自动排序

项目已配置 `prettier-plugin-tailwindcss`，**`pnpm format` 会自动按 Tailwind 官方推荐顺序排列类名**，无需手动维护顺序：

```tsx
// 写代码时随意书写顺序
<div className="p-4 flex text-sm mt-2 items-center" />

// pnpm format 后自动变为：
<div className="mt-2 flex items-center p-4 text-sm" />
```

排序基于 `src/styles/index.css` 中的 Tailwind 入口文件，配置见 `.prettierrc` 的 `tailwindStylesheet` 字段。

### 4.2 其它约束

- 禁止在多处复制相同的类名组合 → 提取为公共组件
- 使用 `tailwind-merge`（`cn()` / `twMerge()`）合并动态类名，避免冲突
- 禁止内联 `style` 替代 Tailwind（除非处理动态计算值，如 `style={{ height: scrollY }}`）
- 禁止 `@apply` 大量重复封装 Tailwind 类（用组件替代）

## 5. 导入顺序

按以下顺序排列，组间空一行：

```tsx
// 1. React 及 React 生态
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// 2. 第三方库
import { Button, message } from 'antd';
import { ProTable } from '@ant-design/pro-components';

// 3. 项目内绝对路径（@ 别名）
import { getUserPage } from '@/api/user';
import type { UserRecord } from '@/types/api';

// 4. 相对路径
import UserFormModal from './components/UserFormModal';
```

## 6. 用户可见文案

**所有**面向用户的字符串必须经 `react-i18next` 的 `t()` 函数：

```tsx
// ❌ 禁止硬编码
<Button>新增用户</Button>

// ✅ 正确
<Button>{t('user.addUser')}</Button>
```

i18n key 命名见 [frontend-state-i18n.md](./frontend-state-i18n.md)。
