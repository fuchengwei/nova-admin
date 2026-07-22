import { useState, useMemo } from 'react';
import { Button, Tree, Space, Popconfirm, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import {
  ProCard,
  ProDescriptions,
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormRadio,
  ProFormTreeSelect,
} from '@ant-design/pro-components';
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

const QUERY_KEY = ['deptTree'];

type TreeSelectNode = { value: number; title: string; children?: TreeSelectNode[] };

export default function DeptPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [selectedDept, setSelectedDept] = useState<DeptTreeNode | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

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
    setModalOpen(true);
  };

  const handleAddChild = () => {
    if (!selectedDept) return;
    setEditMode(false);
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

  const buildTreeSelectData = (data: DeptTreeNode[]): TreeSelectNode[] =>
    data.map((item) => ({
      value: item.id,
      title: item.name,
      children: item.children ? buildTreeSelectData(item.children) : undefined,
    }));

  const treeSelectData = useMemo(() => {
    const source = editMode && excludeTreeData ? excludeTreeData : (treeData ?? []);
    return buildTreeSelectData(source);
  }, [editMode, excludeTreeData, treeData]);

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold m-0">{t('menu.dept')}</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRoot}>
          {t('dept.addRoot')}
        </Button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <ProCard className="w-72 shrink-0 overflow-auto" loading={isLoading}>
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

        <ProCard className="flex-1 overflow-auto">
          {selectedDept ? (
            <>
              <ProDescriptions<DeptTreeNode>
                title={selectedDept.name}
                dataSource={selectedDept}
                column={2}
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

      <ModalForm
        title={editMode ? t('dept.editTitle') : t('dept.addTitle')}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditMode(false);
        }}
        width={560}
        layout="vertical"
        initialValues={
          editMode && selectedDept
            ? {
                parentId: selectedDept.parentId,
                name: selectedDept.name,
                code: selectedDept.code,
                leader: selectedDept.leader,
                phone: selectedDept.phone,
                email: selectedDept.email,
                sort: selectedDept.sort,
                status: selectedDept.status,
              }
            : {
                parentId: selectedDept?.id ?? 0,
                sort: 0,
                status: 1,
              }
        }
        onFinish={async (values) => {
          const res =
            editMode && selectedDept
              ? await updateMutation.mutateAsync({
                  id: selectedDept.id,
                  ...values,
                } as unknown as DeptUpdateRequest)
              : await createMutation.mutateAsync({ ...values } as unknown as DeptCreateRequest);
          if (res.code !== 0) {
            message.error(res.msg || t('common.error'));
            return false;
          }
          message.success(editMode ? t('dept.updateSuccess') : t('dept.createSuccess'));
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
          return true;
        }}
      >
        <ProFormTreeSelect
          name="parentId"
          label={t('dept.parent')}
          rules={[{ required: true, message: t('dept.selectParent') }]}
          fieldProps={{
            treeData: treeSelectData,
            allowClear: true,
            treeDefaultExpandAll: true,
            placeholder: t('dept.selectParent'),
          }}
        />
        <ProFormText
          name="name"
          label={t('dept.name')}
          rules={[{ required: true, message: t('dept.nameRequired') }]}
        />
        <ProFormText name="code" label={t('dept.code')} />
        <ProFormText name="leader" label={t('dept.leader')} />
        <ProFormText name="phone" label={t('dept.phone')} />
        <ProFormText
          name="email"
          label={t('dept.email')}
          rules={[{ type: 'email', message: t('dept.emailInvalid') }]}
        />
        <ProFormDigit name="sort" label={t('dept.sort')} min={0} />
        <ProFormRadio.Group
          name="status"
          label={t('dept.status')}
          rules={[{ required: true }]}
          options={[
            { label: t('dept.enabled'), value: 1 },
            { label: t('dept.disabled'), value: 0 },
          ]}
        />
      </ModalForm>
    </div>
  );
}
