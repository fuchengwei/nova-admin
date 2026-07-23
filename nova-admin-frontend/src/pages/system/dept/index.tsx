import { useState, useMemo } from 'react';
import { Button, Tree, Space, Popconfirm, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { ProCard, ProDescriptions } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getDeptTree,
  getDeptTreeExclude,
  createDept,
  updateDept,
  deleteDept,
  type DeptTreeNode,
  type DeptCreateRequest,
  type DeptUpdateRequest,
} from '@/api/dept';
import { toTreeSelectData } from '@/utils/tree';
import DeptFormModal, { type DeptFormValues } from './components/DeptFormModal';

const QUERY_KEY = ['deptTree'];

export default function DeptPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedDept, setSelectedDept] = useState<DeptTreeNode | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  /** 新增模式下的上级部门 ID（undefined 表示新增根部门） */
  const [addParentId, setAddParentId] = useState<number | undefined>(undefined);

  // 查询部门树
  const { data: treeData, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await getDeptTree();
      return res.data ?? [];
    },
  });

  // 编辑时查询排除自身的部门树
  const { data: excludeTreeData } = useQuery({
    queryKey: [...QUERY_KEY, 'exclude', editMode && selectedDept?.id],
    queryFn: async () => {
      const res = await getDeptTreeExclude(selectedDept!.id);
      return res.data ?? [];
    },
    enabled: editMode && !!selectedDept,
  });

  const createMutation = useMutation({ mutationFn: createDept });
  const updateMutation = useMutation({ mutationFn: updateDept });
  const deleteMutation = useMutation({ mutationFn: deleteDept });

  const handleSelect = (_: unknown, info: { node: DataNode }) => {
    const key = info.node.key as number;
    const find = (nodes?: DeptTreeNode[]): DeptTreeNode | null => {
      if (!nodes) return null;
      for (const n of nodes) {
        if (n.id === key) return n;
        const f = find(n.children);
        if (f) return f;
      }
      return null;
    };
    setSelectedDept(find(treeData));
  };

  const handleAddRoot = () => {
    setEditMode(false);
    setAddParentId(undefined);
    setModalOpen(true);
  };

  const handleAddChild = () => {
    if (!selectedDept) return;
    setEditMode(false);
    setAddParentId(selectedDept.id);
    setModalOpen(true);
  };

  const handleEdit = () => {
    if (!selectedDept) return;
    setEditMode(true);
    setModalOpen(true);
  };

  const hasChildren = useMemo(
    () => !!(selectedDept?.children && selectedDept.children.length > 0),
    [selectedDept],
  );

  const treeSelectData = useMemo(
    () => toTreeSelectData(editMode && excludeTreeData ? excludeTreeData : (treeData ?? [])),
    [editMode, excludeTreeData, treeData],
  );

  const treeNodes: DataNode[] = useMemo(
    () =>
      (treeData ?? []).map((item) => ({
        key: item.id,
        title: item.name,
        children: item.children
          ? (item.children.map((c) => ({ key: c.id, title: c.name })) as DataNode[])
          : undefined,
      })),
    [treeData],
  );

  const handleSubmitDept = async (
    values: DeptFormValues,
    isEdit: boolean,
    record: DeptTreeNode | null,
  ): Promise<boolean> => {
    // 根部门 parentId 为空时转为 0（后端 parentId 为 @NotNull，0 表示根节点）
    const payload = { ...values, parentId: values.parentId ?? 0 };
    const res =
      isEdit && record
        ? await updateMutation.mutateAsync({
            ...payload,
            id: record.id,
          } as unknown as DeptUpdateRequest)
        : await createMutation.mutateAsync(payload as unknown as DeptCreateRequest);
    if (res.code !== 0) {
      message.error(res.msg || t('common.fail'));
      return false;
    }
    message.success(isEdit ? t('dept.updateSuccess') : t('dept.createSuccess'));
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    return true;
  };

  const closeDeptModal = () => {
    setModalOpen(false);
    setEditMode(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold m-0">{t('menu.dept')}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRoot}>
          {t('dept.addRoot')}
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <ProCard className="flex-1 shrink-0 overflow-auto" loading={isLoading}>
          {treeNodes.length > 0 && (
            <Tree
              treeData={treeNodes}
              defaultExpandAll
              showLine={{ showLeafIcon: false }}
              showIcon
              icon={<ApartmentOutlined />}
              onSelect={handleSelect}
              selectedKeys={selectedDept ? [selectedDept.id] : []}
            />
          )}
        </ProCard>

        <ProCard className="flex-2 overflow-auto">
          {selectedDept ? (
            <>
              <ProDescriptions<DeptTreeNode>
                title={selectedDept.name}
                dataSource={selectedDept}
                column={2}
                bordered
                size='small'
                columns={[
                  { title: t('dept.name'), dataIndex: 'name' },
                  { title: t('dept.code'), dataIndex: 'code', render: (v) => v || '-' },
                  { title: t('dept.leader'), dataIndex: 'leader', render: (v) => v || '-' },
                  { title: t('dept.phone'), dataIndex: 'phone', render: (v) => v || '-' },
                  { title: t('dept.email'), dataIndex: 'email', render: (v) => v || '-' },
                  { title: t('dept.sort'), dataIndex: 'sort' },
                  {
                    title: t('dept.status'),
                    dataIndex: 'status',
                    valueEnum: {
                      1: { text: t('dept.enabled'), status: 'Success' },
                      0: { text: t('dept.disabled'), status: 'Error' },
                    },
                  },
                  { title: t('dept.createTime'), dataIndex: 'createTime', render: (v) => v || '-' },
                ]}
              />

              <div className="mt-4">
                <Space>
                  <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                    {t('common.edit')}
                  </Button>
                  <Button icon={<PlusOutlined />} onClick={handleAddChild}>
                    {t('dept.addChild')}
                  </Button>
                  <Popconfirm
                    title={t('dept.deleteConfirm')}
                    description={hasChildren ? t('dept.hasChildren') : undefined}
                    onConfirm={() => {
                      if (!selectedDept) return;
                      deleteMutation.mutate(selectedDept.id);
                      setSelectedDept(null);
                      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
                    }}
                    okText={t('common.confirm')}
                    cancelText={t('common.cancel')}
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger icon={<DeleteOutlined />} loading={deleteMutation.isPending}>
                      {t('common.delete')}
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              {t('dept.selectHint')}
            </div>
          )}
        </ProCard>
      </div>

      <DeptFormModal
        open={modalOpen}
        editMode={editMode}
        record={editMode ? selectedDept : null}
        addParentId={addParentId}
        parentOptions={treeSelectData}
        onSubmit={handleSubmitDept}
        onClose={closeDeptModal}
      />
    </div>
  );
}
