# 前端 Tailwind CSS 与 CSS Modules 迁移设计

## 目标

将 `nova-admin-frontend/src` 中可由 Tailwind CSS 表达的业务样式迁移为组件 `className`，将复杂选择器、伪元素、富文本和第三方组件深度覆盖迁移到就近的 `*.module.css`。迁移保持现有视觉、交互和响应式行为不变，并让全局样式只承担真正的全局职责。

## 范围

- 盘点并迁移 `src/styles/index.css` 中的通知、通知发布工作区、富文本内容、富文本编辑器、公告弹窗、页面填充布局等业务样式。
- 检查前端其余 CSS 文件及组件中的业务 class，统一遵循 Tailwind 优先、CSS Module 局部化的规则。
- 更新 `docs/rules/frontend-code-style.md`，将迁移原则写入长期前端开发规范。
- 保留既有 Ant Design 主题和全局布局兼容所必需的规则，不引入新的第三方依赖。

## 样式分层

### 全局 `src/styles/index.css`

仅保留：

1. Tailwind CSS 入口与 `@theme` 设计令牌。
2. `html`、`body`、`#root` 的基础高度、边距、字体和页面背景。
3. 跨页面且无法通过组件属性表达的 Ant Design 兼容规则，例如布局背景透明化。
4. 必须全局生效的浏览器基础行为。

禁止新增或继续保留业务专用的 `.notification-*`、`.notice-*`、`.announcement-*`、`.page-fill*` 等 class 定义。

### Tailwind class

普通布局、间距、尺寸、颜色、字体、边框、圆角、阴影、溢出、断点和状态样式优先直接写在组件 `className` 中。动态 class 使用项目既有的 `cn()`/`twMerge()` 约定，避免字符串冲突。

### CSS Modules

以下情况使用组件或功能目录旁的 `*.module.css`：

- 伪类、伪元素、滚动条等 Tailwind 表达成本高或可读性明显下降的规则。
- 富文本 HTML 标签、编辑器工具栏等需要嵌套选择器的规则。
- Ant Design 组件内部 DOM 的深层覆盖。
- 同一功能内被多个局部组件复用、但不具备跨业务全局语义的复杂样式。

第三方选择器必须通过 `:global(...)` 限定在本地模块作用域内；不得借 CSS Module 重新制造全局业务 class。

## 迁移顺序

1. 提取并确认全局基础规则，确保 Tailwind 入口和 Ant Design 兼容行为稳定。
2. 迁移通知铃铛、弹出层和通知列表，样式放入 `NotificationBell.module.css` 或通知功能局部模块。
3. 迁移通知发布工作区、历史、详情及其子组件，普通样式改为 Tailwind，复杂交互样式放入功能模块。
4. 迁移富文本内容、公告弹窗和富文本编辑器，保留必要的富文本标签选择器及 Ant Design 深层覆盖。
5. 迁移 `page-fill`、`tabs-fill` 等布局 class，并扫描剩余 CSS 业务选择器。
6. 更新前端规则文档，删除已迁移的全局业务 CSS。

## 兼容性与验证

- 不改变组件 DOM 语义、交互逻辑、文案、i18n key 或 API 行为。
- 保留现有响应式断点、滚动区域、焦点态和无障碍轮廓。
- 迁移后运行 `pnpm exec prettier --write`（仅涉及文件）、`pnpm type-check`、`pnpm build`、`pnpm exec prettier --check` 和 `git diff --check`。
- 使用 `rg` 扫描 `src/styles/index.css`，确认不再存在业务专用 class 定义；检查 CSS Module 导入与 className 引用一一对应。
- 若构建或类型检查暴露已有工具链问题，记录为验证结果，不通过改动无关依赖扩大范围。

## 变更边界

迁移只修改前端样式、受影响组件的 className/模块导入以及前端规则文档；保留工作区中与本任务无关的已有改动，不自动提交。
