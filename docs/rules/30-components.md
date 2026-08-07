# 前端组件与页面布局规则

> applies_to: `nova-admin-frontend/src/pages/**`, `nova-admin-frontend/src/components/**`

## 1. 组件选型

| 场景 | 首选 | 不使用 |
|---|---|---|
| 列表、搜索、分页、工具栏 | `ProTable` | `Table` + 手写分页 |
| 新增/编辑弹窗 | `ModalForm` | `Modal` + 手写 `Form` |
| 抽屉表单 | `DrawerForm` | `Drawer` + 手写 `Form` |
| 只读详情 | `ProDescriptions` | 手工罗列 `Descriptions` |
| 页面骨架 | `ProLayout` / `PageContainer` | 自建页面容器 |
| 统计卡片 | `StatisticCard` / `ProCard` | 重复实现卡片结构 |

只有 ProComponents 无法覆盖的特殊交互才回落到 Ant Design 基础组件。

## 2. ProTable 数据契约

- 列表数据必须通过 `request`，返回 `{ data, success, total }`。
- 必须声明 `rowKey` 和 `actionRef`；写操作成功后调用 `actionRef.current?.reload()`。
- 分页使用 `pagination={{ pageSize: 10, showSizeChanger: true }}` 或项目页面已确定的同类配置。
- 搜索字段使用列的 `valueType` / `valueEnum`，不重复写一套搜索表单。
- 操作列使用 `valueType: 'option'`，固定在右侧并给出稳定宽度。
- 文本空值统一使用 `displayText`；带单位、Tag、链接等特殊列在自定义 render 中处理空值。

## 3. 全高表格页面

普通全屏列表页统一采用下面的结构：

```tsx
const { wrapperRef, scrollY } = useTableScrollY();

return (
  <div className="flex h-full min-h-0 flex-col">
    <div ref={wrapperRef} className="min-h-0 flex-1">
      <div className={`${layoutStyles.tableFill} h-full`}>
        <ProTable
          style={{ height: '100%' }}
          scroll={{ x: 1100, y: scrollY }}
          request={request}
        />
      </div>
    </div>
  </div>
);
```

规则：

- `wrapperRef` 绑定到 `min-h-0 flex-1` 容器；`tableFill` 绑定到内部 `h-full` 容器。
- 表体高度通过 `useTableScrollY` 计算，禁止为普通全高列表写死 `scroll.y`。
- 使用 `PageContainer` 时，根节点增加 `layoutStyles.pageFill`。
- Tabs 内表格使用 `layoutStyles.tabsFill`；弹窗/抽屉内表格按容器实际高度处理，不强行套用全屏页面结构。
- `ProTable` 必须设置 `style={{ height: '100%' }}`，使卡片、表体和分页器留在可用区域内。

## 4. 表单和弹窗

- 新增和编辑共用一个 `ModalForm` / `DrawerForm`，由 `editingRecord` 或等价状态区分模式。
- 表单提交前完成前端校验；提交函数返回 `false` 保持弹窗打开，成功返回 `true` 并刷新列表。
- 普通表单字段优先使用 ProForm 系列，状态选择使用 `ProFormSelect` / `ProFormRadio.Group`。
- 弹窗宽度、滚动区域和 `destroyOnHidden` 按页面内容设置，避免表单超出视口。
- 危险写操作必须有确认、加载态和失败反馈；不能在请求完成前关闭弹窗。

## 5. 页面文件边界

- `index.tsx` 负责页面状态、布局和数据分发。
- 列定义超过 6 列或包含复杂 render 时，提取同目录 `columns.tsx`。
- 表单弹窗、详情抽屉、复杂展示块分别提取为单职责组件。
- 跨页面布局规则放在 `src/styles/layout.module.css`，不要在页面复制一套深层 Ant Design 选择器。
