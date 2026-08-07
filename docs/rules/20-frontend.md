# 前端开发规则

> applies_to: `nova-admin-frontend/src/**`

## 1. 文件和命名

- 组件文件使用 `PascalCase.tsx`，Hook 使用 `useXxx.ts`，工具函数使用 camelCase 文件名。
- 一个文件只承载一个主要组件；页面超过约 250 行时优先拆出列定义、弹窗和局部 Hook。
- 只在一个页面使用的组件放在 `pages/<module>/components/`；两个及以上页面复用时才放入 `src/components/`。
- API 函数放在 `src/api/`，全局 Store 放在 `src/stores/`，通用 Hook 放在 `src/hooks/`，工具函数放在 `src/utils/`。
- 禁止为单纯透传属性的基础组件增加薄封装。

## 2. TypeScript

- 禁止 `any`；未知输入使用 `unknown` 并通过类型守卫收窄。
- 领域返回类型使用 `XxxRecord`，创建/更新请求使用 `XxxCreateRequest` / `XxxUpdateRequest`，分页参数使用 `XxxPageQuery`。
- 雪花 ID 始终建模为 `string`，包括 `rowKey`、路径参数和 ID 数组；分页总数、文件大小、耗时等普通数字保持 `number`。
- 不把魔法字符串和数字散落在组件中，提取为常量或类型安全的枚举映射。
- 组件和 Hook 使用函数式写法，禁止 class component。

## 3. 状态和请求

- `useUserStore` 只保存用户、菜单和权限；`useAppStore` 只保存语言、主题和侧栏状态。
- 弹窗显隐、表单编辑态、加载态等页面临时状态使用 `useState`，不放入全局 Store。
- 表格列表由 `ProTable.request` 管理，不使用 `useQuery` 拉取后再传 `dataSource`。
- 详情、统计、树形选项等非表格服务端数据使用 TanStack Query `useQuery`。
- 新增、修改、删除、状态切换等写操作使用 `useMutation`，成功后刷新对应 `actionRef` 或失效查询。
- 业务组件不得直接使用 Axios；统一通过 `src/utils/request.ts` 和 `src/api/` 调用后端。

## 4. 国际化

- 所有用户可见文本、校验提示、空态、错误反馈和按钮文案必须走 `t()`。
- 新增 i18n key 时同时修改 `src/i18n/zh.ts` 与 `src/i18n/en.ts`，两者保持相同键结构。
- key 按页面或模块分组，避免使用含义不清的全局短 key。
- 不把服务端错误原文直接当作唯一用户文案，使用 `res.msg || t('...')` 提供稳定兜底。

## 5. 样式

- 布局、间距、尺寸、颜色、排版和响应式优先使用 Tailwind CSS。
- 伪元素、富文本、编辑器工具栏和第三方组件深层覆盖使用就近 CSS Modules。
- CSS Modules 中的第三方选择器必须通过局部根 class 和 `:global(...)` 限定作用域。
- `src/styles/index.css` 只放 Tailwind 入口、设计令牌、根节点基础样式和真正跨页面的兼容规则。
- 动态样式值可以使用 `style`；静态样式不要用内联 style 替代 Tailwind。
- 类名由 Prettier Tailwind 插件统一排序，禁止手工维护多份重复 class 组合。

## 6. 文案和交互

- 统一使用项目已有的 Ant Design、ProComponents 和图标库，不重复引入组件库。
- 按钮优先使用图标表达明确动作；删除、危险操作使用 `Popconfirm` 或明确确认流程。
- 表格和详情中的空文本统一显示 `-`，不得用 `value || '-'` 覆盖合法的 `0` 或 `false`。
- 页面布局和表格规则见 [`30-components.md`](./30-components.md)。
