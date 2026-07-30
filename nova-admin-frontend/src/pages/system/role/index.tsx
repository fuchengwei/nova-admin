import { useState, useEffect, useRef } from 'react';
import { Button, Tag, Tree, Popconfirm, Form } from 'antd';
import { message } from '@/utils/message';
import type { DataNode } from 'antd/es/tree';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormDigit,
  ProFormRadio,
  PageContainer,
  type ProColumns,
  type ActionType,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getRolePage,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  type RoleRecord,
  type RolePageParams,
  type RoleCreateRequest,
  type RoleUpdateRequest,
} from '@/api/role';
import { getMenuTree } from '@/api/menu';
import { useTableScrollY } from '@/hooks/useTableScrollY';
import { displayText } from '@/utils/display';

const DATA_SCOPE_MAP: Record<number, string> = {
  1: 'dataScopeAll',
  2: 'dataScopeDeptAndChild',
  3: 'dataScopeDept',
  4: 'dataScopeSelfAndChild',
  5: 'dataScopeSelf',
};

export default function RolePage() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RoleRecord | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

  const { data: menuTree } = useQuery({
    queryKey: ['menuTree'],
    queryFn: async () => {
      const res = await getMenuTree();
      return res.data ?? [];
    },
  });

  const { data: roleDetail } = useQuery({
    queryKey: ['roleDetail', editMode && editingRecord?.id],
    queryFn: async () => {
      const res = await getRoleDetail(editingRecord!.id);
      return res.data;
    },
    enabled: editMode && !!editingRecord,
  });

  useEffect(() => {
    if (roleDetail && editMode) setCheckedKeys(roleDetail.menuIds ?? []);
  }, [roleDetail, editMode]);

  const createMutation = useMutation({ mutationFn: createRole });
  const updateMutation = useMutation({ mutationFn: updateRole });
  const deleteMutation = useMutation({ mutationFn: deleteRole });

  const handleOpenAdd = () => {
    setEditMode(false);
    setEditingRecord(null);
    setCheckedKeys([]);
    setModalOpen(true);
  };

  const handleOpenEdit = (record: RoleRecord) => {
    setEditMode(true);
    setEditingRecord(record);
    setCheckedKeys([]);
    setModalOpen(true);
  };

  const handleMenuCheck = (
    checked: React.Key[] | { checked: React.Key[]; halfChecked: React.Key[] },
  ) => {
    const keys = Array.isArray(checked) ? checked : checked.checked;
    setCheckedKeys(keys.map(String));
  };

  const menuTreeNodes: DataNode[] = (menuTree ?? []).map((item) => ({
    key: item.id,
    title: item.name,
    children: item.children
      ? (item.children.map((c) => ({ key: c.id, title: c.name })) as DataNode[])
      : undefined,
  }));

  const columns: ProColumns<RoleRecord>[] = [
    {
      title: t('role.roleName'),
      dataIndex: 'name',
      width: 160,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('role.roleCode'),
      dataIndex: 'code',
      width: 160,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('role.dataScope'),
      dataIndex: 'dataScope',
      width: 160,
      valueType: 'select',
      valueEnum: {
        1: { text: t('role.dataScopeAll') },
        2: { text: t('role.dataScopeDeptAndChild') },
        3: { text: t('role.dataScopeDept') },
        4: { text: t('role.dataScopeSelfAndChild') },
        5: { text: t('role.dataScopeSelf') },
      },
      render: (_, record) => {
        const key = DATA_SCOPE_MAP[record.dataScope];
        return key ? <Tag color="blue">{t(`role.${key}`)}</Tag> : '-';
      },
    },
    {
      title: t('role.sort'),
      dataIndex: 'sort',
      width: 80,
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('role.status'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        1: { text: t('role.enabled'), status: 'Success' },
        0: { text: t('role.disabled'), status: 'Error' },
      },
      render: (_, record) =>
        record.status === 1 ? (
          <Tag color="green">{t('role.enabled')}</Tag>
        ) : (
          <Tag color="red">{t('role.disabled')}</Tag>
        ),
    },
    {
      title: t('role.createTime'),
      dataIndex: 'createTime',
      width: 180,
      valueType: 'dateTime',
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('role.action'),
      valueType: 'option',
      key: 'option',
      width: 160,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(record)}
        >
          {t('common.edit')}
        </Button>,
        <Popconfirm
          key="del"
          title={t('role.deleteConfirm')}
          onConfirm={() => deleteMutation.mutate(record.id)}
          okText={t('common.confirm')}
          cancelText={t('common.cancel')}
          okButtonProps={{ danger: true }}
        >
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            {t('common.delete')}
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  const { wrapperRef, scrollY } = useTableScrollY();

  return (
    <PageContainer title={t('menu.role')} className="page-fill">
      <div ref={wrapperRef} className="flex min-h-0 flex-1 flex-col">
        <ProTable<RoleRecord>
          actionRef={actionRef}
          rowKey="id"
          headerTitle={t('menu.role')}
          columns={columns}
          style={{ height: '100%' }}
          scroll={{ x: 1000, y: scrollY }}
          request={async (params) => {
            const payload: RolePageParams = {
              current: params.current ?? 1,
              size: params.pageSize ?? 10,
              name: params.name,
              code: params.code,
              status: params.status,
            };
            const res = await getRolePage(payload);
            if (res.code !== 0) return { data: [], success: false, total: 0 };
            return {
              data: res.data.records,
              success: true,
              total: res.data.total,
            };
          }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          search={{ labelWidth: 'auto' }}
          toolBarRender={() => [
            <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
              {t('role.addRole')}
            </Button>,
          ]}
          options={{ reload: true, density: true, setting: true }}
        />
      </div>

      <ModalForm
        title={editMode ? t('role.editRole') : t('role.addRole')}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setEditMode(false);
            setEditingRecord(null);
            setCheckedKeys([]);
          }
        }}
        width={720}
        layout="vertical"
        initialValues={
          editMode && editingRecord
            ? {
                name: editingRecord.name,
                code: editingRecord.code,
                description: editingRecord.description,
                dataScope: editingRecord.dataScope,
                sort: editingRecord.sort,
                status: editingRecord.status,
              }
            : { dataScope: 1, sort: 0, status: 1 }
        }
        onFinish={async (values) => {
          const payload = { ...values, menuIds: checkedKeys };
          const res =
            editMode && editingRecord
              ? await updateMutation.mutateAsync({
                  id: editingRecord.id,
                  ...payload,
                } as unknown as RoleUpdateRequest)
              : await createMutation.mutateAsync(payload as unknown as RoleCreateRequest);
          if (res.code !== 0) {
            message.error(res.msg || t('common.error'));
            return false;
          }
          message.success(editMode ? t('role.updateSuccess') : t('role.createSuccess'));
          actionRef.current?.reload();
          return true;
        }}
      >
        <div className="grid grid-cols-2 gap-x-4">
          <ProFormText
            name="name"
            label={t('role.roleName')}
            disabled={editMode}
            rules={[{ required: true, message: t('role.roleNameRequired') }]}
          />
          <ProFormText
            name="code"
            label={t('role.roleCode')}
            disabled={editMode}
            rules={[{ required: true, message: t('role.roleCodeRequired') }]}
          />
          <ProFormTextArea
            name="description"
            label={t('role.description')}
            className="col-span-2"
          />
          <ProFormSelect
            name="dataScope"
            label={t('role.dataScope')}
            rules={[{ required: true, message: t('role.dataScopeRequired') }]}
            options={[
              { label: t('role.dataScopeAll'), value: 1 },
              { label: t('role.dataScopeDeptAndChild'), value: 2 },
              { label: t('role.dataScopeDept'), value: 3 },
              { label: t('role.dataScopeSelfAndChild'), value: 4 },
              { label: t('role.dataScopeSelf'), value: 5 },
            ]}
          />
          <ProFormDigit name="sort" label={t('role.sort')} min={0} />
          <ProFormRadio.Group
            name="status"
            label={t('role.status')}
            rules={[{ required: true }]}
            options={[
              { label: t('role.enabled'), value: 1 },
              { label: t('role.disabled'), value: 0 },
            ]}
          />
        </div>

        <Form.Item label={t('role.assignMenus')}>
          <Tree
            checkable
            checkedKeys={checkedKeys}
            onCheck={handleMenuCheck}
            treeData={menuTreeNodes}
            defaultExpandAll
            height={280}
            className="rounded border p-2"
          />
        </Form.Item>
      </ModalForm>
    </PageContainer>
  );
}
