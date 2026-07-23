/** antd TreeSelect / ProFormTreeSelect 通用树节点结构 */
export interface TreeSelectNode {
  value: number;
  title: string;
  children?: TreeSelectNode[];
}

/**
 * 将后端自相似树形数据转换为 antd TreeSelect / ProFormTreeSelect 所需的节点结构。
 * 要求节点具备 `id`、`name` 及可选的 `children`（结构自相似）。
 * @param data 原始树形数据（为空时返回空数组）
 * @returns 转换后的树节点数组
 */
export const toTreeSelectData = <T extends { id: number; name: string; children?: T[] }>(
  data?: T[],
): TreeSelectNode[] => {
  if (!data) return [];
  return data.map((item) => ({
    value: item.id,
    title: item.name,
    children: item.children ? toTreeSelectData(item.children) : undefined,
  }));
};
