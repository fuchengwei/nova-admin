# 图标选择器公共组件设计

## 1. 背景与目标

菜单编辑弹框当前通过文本输入手动填写 Ant Design 图标组件名称，容易产生拼写错误，也无法直观看到图标效果。本设计新增一个可复用、受控的图标选择器，并将其接入菜单编辑表单。

目标：

- 展示全部可用的 Ant Design Icons，并提供图标预览。
- 使用紧凑的正方形网格选择图标。
- 支持按图标英文组件名和中文别名实时搜索。
- 支持点击选择、清空和点击外部区域收起。
- 保留历史数据中的未知图标名称，不静默替换或清洗。
- 通过 `value` 与 `onChange` 支持 Ant Design Form 受控用法。
- 使用 TailwindCSS 完成组件样式，不新增独立 CSS 文件。

## 2. 范围

### 本次范围

- 新增公共 `IconPicker` 组件。
- 新增全部 Ant Design Icons 的静态目录及中文别名数据。
- 将菜单编辑表单的图标文本输入替换为 `IconPicker`。
- 统一菜单页和布局工具的图标解析，避免维护两份图标映射。
- 为过滤逻辑和交互行为预留 Vitest + React Testing Library 测试边界。
- 新增中英文界面文案。

### 不在本次范围

- 修改后端菜单接口或数据库字段；图标值仍使用现有字符串字段。
- 引入远程词典、翻译服务或运行时网络依赖。
- 为每个图标维护英文同义词表；组件名称本身是英文搜索来源。
- 临时引入新的前端测试框架；当前仓库尚未配置前端测试基础设施。

## 3. 组件结构

新增目录：

```text
nova-admin-frontend/src/components/IconPicker/
├── index.tsx
├── IconPickerPanel.tsx
└── icon-catalog.ts
```

### `IconPicker`

公共受控组件，负责：

- 触发器展示。
- 展开/收起状态。
- 搜索词状态。
- 通过 Ant Design `Popover`（或同等受控浮层能力）定位面板。
- 点击外部区域收起。
- 选择和清空回调。
- 未知历史值的保留展示。
- Escape 关闭并恢复触发器焦点。

接口：

```ts
export interface IconPickerProps {
  value?: string;
  onChange?: (value?: string) => void;
  disabled?: boolean;
  placeholder?: string;
}
```

`value` 和 `onChange` 使用 Ant Design Form 的默认字段约定，菜单表单可以通过 `Form.Item name="icon"` 直接接入。

### `IconPickerPanel`

面板展示组件，负责：

- 搜索输入框。
- 过滤结果网格。
- 正方形图标单元格。
- 当前值选中态。
- 键盘可聚焦及选择。
- 无结果状态。

面板通过明确的 props 接收过滤后的目录项、当前值、搜索词变化回调和选择回调，不直接修改表单值。

### `icon-catalog`

纯数据与查询模块，负责：

- 静态注册全部 Ant Design Icons。
- 保存稳定的组件名称。
- 保存中文别名。
- 提供名称解析、图标渲染和过滤工具。

目录项结构：

```ts
export interface IconCatalogItem {
  name: string;
  aliases: string[];
  icon: React.ComponentType;
}
```

实际保存值为完整的组件名，例如 `UserOutlined`。目录以组件名作为唯一 key，不允许重复项。

## 4. 图标目录与搜索

### 4.1 目录内容

目录覆盖 `@ant-design/icons` 当前依赖版本中的全部可用图标组件，并显式导入组件后建立静态映射，不依赖运行时字符串反射。这样可以保证打包行为和保存值稳定，代价是会增加前端 bundle 体积。

目录模块提供：

```ts
export const iconCatalog: readonly IconCatalogItem[];
export const iconCatalogMap: ReadonlyMap<string, IconCatalogItem>;
export function getIcon(iconName?: string): React.ReactNode;
export function filterIconCatalog(
  catalog: readonly IconCatalogItem[],
  keyword: string,
): IconCatalogItem[];
```

`getIcon` 对已知名称返回对应图标；对空值或未知名称返回 `AppstoreOutlined` 作为视觉占位。该回退只影响渲染，不修改调用方的原始字符串。

### 4.2 搜索字段

搜索匹配以下内容：

1. 完整英文组件名，例如 `UserOutlined`。
2. 去除 Ant Design 风格后缀后的名称，例如 `User`。
3. 中文别名，例如“用户”“个人”“账户”“成员”。

英文比较忽略大小写，中文使用包含匹配。搜索词为空时返回完整目录。搜索结果仅影响面板展示，不修改当前 `value`。

不维护英文别名或英文同义词表，因为组件名称及去除风格后缀后的名称已提供稳定英文搜索入口。中文别名表按图标维护，覆盖常见业务语义；目录数据独立于组件逻辑，后续可单独补充和校正。

## 5. 交互设计

### 5.1 触发器

触发器使用按钮语义，支持鼠标、Enter 和 Space 操作：

- 已知图标：显示图标预览和完整组件名称，例如 `UserOutlined`。
- 未知历史值：显示 `AppstoreOutlined` 占位图标和原始字符串，不替换值。
- 空值：显示当前语言的 placeholder。
- 有值且未禁用时显示清除按钮。
- `disabled` 时不能展开、选择或清空，并显示禁用状态。

### 5.2 面板

- 点击触发器打开面板。
- 每次打开时清空搜索词，展示完整目录。
- 面板打开后搜索框获得焦点。
- 搜索框、网格和滚动区域的交互不会触发外部收起。
- 点击外部区域自动收起。
- 点击图标后立即调用 `onChange(name)` 并收起。
- 点击清除后调用 `onChange(undefined)` 并收起。
- Escape 收起面板并将焦点还给触发器。

### 5.3 网格

- 使用 TailwindCSS 的 CSS Grid 工具类布局。
- 网格单元格使用 `aspect-square`，保证正方形点击区域。
- 采用紧凑多列布局，设置固定最大高度，面板内容独立滚动。
- 单元格使用按钮语义，支持键盘聚焦和选择。
- 当前选中项使用边框、背景色和可访问的选中状态突出显示。
- 单元格通过 tooltip 或辅助文本提供组件名称，避免只能凭图形辨认。
- 无搜索结果时展示国际化空状态，不改变当前值。

### 5.4 未知值

打开或初始化组件时不对 `value` 做目录清洗。未知值的原始字符串始终保留并显示，用户可以重新选择已知图标或主动清空。不得因为未知值而自动提交 `AppstoreOutlined`。

## 6. 国际化

新增选择器所需的中英文 i18n 文案，至少包括：

- 图标选择器 placeholder。
- 搜索图标提示。
- 清除图标按钮标签。
- 无匹配结果提示。
- 未知图标提示。
- 当前图标的无障碍标签。

所有新增用户可见文案同步写入 `src/i18n/zh.ts` 和 `src/i18n/en.ts`，通过 `react-i18next` 的 `t()` 获取。

界面语言切换只更新文案和搜索提示，不改变图标组件名称、后端保存值或当前选中状态。搜索始终支持英文组件名称；中文别名用于中文语义搜索。

## 7. 菜单表单集成

菜单编辑表单中，非按钮类型的图标字段由原有 `ProFormText` 替换为：

```tsx
<Form.Item name="icon">
  <IconPicker />
</Form.Item>
```

现有按钮类型条件渲染保持不变，按钮类型继续隐藏图标字段。新建和编辑模式均沿用现有 `initialValues` 与提交流程：

- 编辑时将后端返回的 `icon?: string` 原样传给 `IconPicker`。
- 用户选择图标时写入完整组件名。
- 用户清空时回调 `undefined`，由现有 API 请求类型继续处理可选字段。
- 表单重置或外部字段更新时，受控组件同步显示新的 `value`。
- 不修改 `MenuInfo.icon`、`MenuCreateRequest.icon` 或 `MenuUpdateRequest.icon` 类型。

同时，菜单页和 `src/utils/layout.tsx` 使用同一目录的 `getIcon`，删除重复的本地图标映射。未知菜单图标仍以默认占位图标渲染，但不会改变后端数据。

## 8. 可访问性

- 触发器为按钮语义，暴露展开状态。
- 网格项为可聚焦按钮，具备图标名称 `aria-label`。
- 选中项暴露选中状态。
- 搜索框具备国际化 label 或 placeholder。
- Escape 关闭后焦点返回触发器。
- 清除按钮具备独立的国际化 `aria-label`，避免与触发器点击区域混淆。
- 禁用状态阻止所有会修改值的操作。

## 9. 边界与错误处理

- 空值：显示 placeholder，仍可打开面板。
- 未知值：保留原始名称并使用占位图标，不自动替换。
- 清空：仅在有值时显示清除操作，触发 `onChange(undefined)`。
- 无搜索结果：显示空状态，不修改当前值。
- 目录项异常：缺少可渲染图标组件的项不展示，不影响其他项。
- 重复名称：在目录构建阶段保证唯一，重复项不得进入网格。
- 禁用：阻止展开、搜索、选择和清空。
- 语言切换：保持当前图标字符串不变。

## 10. 测试策略

当前前端尚未配置测试脚本或 Vitest/React Testing Library，因此实现阶段不临时引入另一套测试工具。接入既定测试基础设施后应覆盖以下边界。

### 10.1 目录与纯函数

- 完整组件名称匹配。
- 忽略大小写匹配。
- 去除 `Outlined`、`Filled`、`TwoTone` 后缀后的名称匹配。
- 中文别名匹配。
- 空搜索返回全部图标。
- 无匹配返回空数组。
- 目录名称唯一。
- 未知名称返回占位图标。

### 10.2 组件交互

- 点击触发器展开和收起。
- 点击外部区域收起，点击面板内部不误收起。
- 面板打开后搜索框获得焦点。
- 点击图标调用 `onChange(name)` 并收起。
- 点击清除调用 `onChange(undefined)` 并收起。
- 未知值原样展示。
- 禁用状态阻止所有修改行为。
- Escape 收起并恢复触发器焦点。
- 键盘可以聚焦并选择图标。
- 外部更新 `value` 后触发器同步显示。

### 10.3 菜单集成

- 非按钮类型显示图标选择器。
- 按钮类型继续隐藏图标字段。
- 新建和编辑模式正确传递图标值。
- 清空图标后提交数据不再保留旧值。

## 11. 验收标准

- 菜单编辑弹框不再要求手动输入图标名称。
- 选择器可展开并以正方形紧凑网格展示全部目录图标。
- 搜索英文组件名、去风格后缀名称和中文别名均能得到正确结果。
- 选择、清空、外部收起和键盘操作符合设计。
- 未知历史图标值不会被静默替换。
- 中英文界面文案均可正常显示。
- 组件可在其他表单中通过 `value`/`onChange` 复用。
- 菜单树、详情和布局路由继续正确渲染已知与未知图标。
- 不新增独立 CSS 文件，样式全部使用 TailwindCSS。
