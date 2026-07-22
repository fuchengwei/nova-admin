import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Radio,
  Select,
  InputNumber,
  Tree,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const QUERY_KEY = ['rolePage'];

const DATA_SCOPE_MAP: Record<number, string> = {
  1: 'dataScopeAll',
  2: 'dataScopeDeptAndChild',
  3: 'dataScopeDept',
  4: 'dataScopeSelfAndChild',
  5: 'dataScopeSelf',
};

export default function RolePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const [pageParams, setPageParams] = useState<RolePageParams>({ current: 1, size: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RoleRecord | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);

  // 查询角色分页
  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, pageParams],
    queryFn: async () => {
      const res = await getRolePage(pageParams);
      return res.data;
    },
  });

  // 菜单树
  const { data: menuTree } = useQuery({
    queryKey: ['menuTree'],
    queryFn: async () => {
      const res = await getMenuTree();
      return res.data ?? [];
    },
  });

  // 编辑时获取角色详情（含 menuIds）
  const { data: roleDetail } = useQuery({
    queryKey: ['roleDetail', editMode && editingRecord?.id],
    queryFn: async () => {
      const res = await getRoleDetail(editingRecord!.id);
      return res.data;
    },
    enabled: editMode && !!editingRecord,
  });

  // 当角色详情加载后，设置 checkedKeys
  useEffect(() => {
    if (roleDetail && editMode) {
      setCheckedKeys(roleDetail.menuIds ?? []);
    }
  }, [roleDetail, editMode]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('role.createSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        handleCloseModal();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateRole,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('role.updateSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        handleCloseModal();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('role.deleteSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });

  const handleOpenAdd = () => {
    setEditMode(false);
    setEditingRecord(null);
    form.resetFields();
    setCheckedKeys([]);
    form.setFieldsValue({ dataScope: 1, sort: 0, status: 1 });
    setModalOpen(true);
  };

  const handleOpenEdit = (record: RoleRecord) => {
    setEditMode(true);
    setEditingRecord(record);
    form.resetFields();
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,
      dataScope: record.dataScope,
      sort: record.sort,
      status: record.status,
    });
    // checkedKeys 会在 roleDetail 加载后设置
    setCheckedKeys([]);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingRecord(null);
    setCheckedKeys([]);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, menuIds: checkedKeys };
      if (editMode && editingRecord) {
        const data: RoleUpdateRequest = { id: editingRecord.id, ...payload };
        updateMutation.mutate(data);
      } else {
        const data: RoleCreateRequest = { ...payload };
        createMutation.mutate(data);
      }
    } catch {
      // validation failed
    }
  };

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    const params: RolePageParams = { current: 1, size: pageParams.size };
    if (values.name) params.name = values.name;
    if (values.code) params.code = values.code;
    if (values.status !== undefined && values.status !== null && values.status !== '')
      params.status = values.status;
    setPageParams(params);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPageParams({ current: 1, size: 10 });
  };

  // 菜单树 onCheck
  const handleMenuCheck = (
    checked:
      | React.Key[]
      | { checked: React.Key[]; halfChecked: React.Key[] },
  ) => {
    const keys = Array.isArray(checked) ? checked : checked.checked;
    setCheckedKeys(keys as number[]);
  };

  const columns = [
    {
      title: t('role.roleName'),
      dataIndex: 'name',
      key: 'name',
      width: 160,
    },
    {
      title: t('role.roleCode'),
      dataIndex: 'code',
      key: 'code',
      width: 160,
    },
    {
      title: t('role.dataScope'),
      dataIndex: 'dataScope',
      key: 'dataScope',
      width: 160,
      render: (v: number) => {
        const key = DATA_SCOPE_MAP[v];
        return key ? <Tag color="blue">{t(`role.${key}`)}</Tag> : '-';
      },
    },
    {
      title: t('role.sort'),
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: t('role.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) =>
        v === 1 ? (
          <Tag color="green">{t('role.enabled')}</Tag>
        ) : (
          <Tag color="red">{t('role.disabled')}</Tag>
        ),
    },
    {
      title: t('role.createTime'),
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (v: string) => v || '-',
    },
    {
      title: t('role.action'),
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: RoleRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('role.deleteConfirm')}
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">{t('menu.role')}</h2>

      {/* 搜索栏 */}
      <Card className="mb-4" styles={{ body: { padding: '16px' } }}>
        <Form form={searchForm} layout="inline" className="flex flex-wrap gap-2">
          <Form.Item name="name" label={t('role.roleName')}>
            <Input placeholder={t('role.roleName')} allowClear />
          </Form.Item>
          <Form.Item name="code" label={t('role.roleCode')}>
            <Input placeholder={t('role.roleCode')} allowClear />
          </Form.Item>
          <Form.Item name="status" label={t('role.status')}>
            <Select placeholder={t('role.status')} allowClear style={{ width: 120 }}>
              <Select.Option value={1}>{t('role.enabled')}</Select.Option>
              <Select.Option value={0}>{t('role.disabled')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                {t('common.search')}
              </Button>
              <Button onClick={handleReset}>{t('common.reset')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 表格区域 */}
      <Card className="flex-1">
        <div className="flex justify-between mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
            {t('role.addRole')}
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries({ queryKey: QUERY_KEY })}
          >
            {t('common.reset')}
          </Button>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.records ?? []}
          loading={isLoading}
          scroll={{ x: 1000 }}
          pagination={{
            current: data?.current ?? pageParams.current,
            pageSize: data?.size ?? pageParams.size,
            total: data?.total ?? 0,
            showSizeChanger: true,
            showTotal: (total: number) => t('common.total', { total }),
            onChange: (page: number, pageSize: number) => {
              setPageParams((prev) => ({ ...prev, current: page, size: pageSize }));
            },
          }}
        />
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editMode ? t('role.editRole') : t('role.addRole')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={submitting}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnClose
        width={720}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="name"
              label={t('role.roleName')}
              rules={[{ required: true, message: t('role.roleNameRequired') }]}
            >
              <Input placeholder={t('role.roleName')} />
            </Form.Item>

            <Form.Item
              name="code"
              label={t('role.roleCode')}
              rules={[{ required: true, message: t('role.roleCodeRequired') }]}
            >
              <Input placeholder={t('role.roleCode')} disabled={editMode} />
            </Form.Item>

            <Form.Item name="description" label={t('role.description')} className="col-span-2">
              <Input.TextArea rows={2} placeholder={t('role.description')} />
            </Form.Item>

            <Form.Item
              name="dataScope"
              label={t('role.dataScope')}
              rules={[{ required: true, message: t('role.dataScopeRequired') }]}
            >
              <Select placeholder={t('role.dataScope')}>
                <Select.Option value={1}>{t('role.dataScopeAll')}</Select.Option>
                <Select.Option value={2}>{t('role.dataScopeDeptAndChild')}</Select.Option>
                <Select.Option value={3}>{t('role.dataScopeDept')}</Select.Option>
                <Select.Option value={4}>{t('role.dataScopeSelfAndChild')}</Select.Option>
                <Select.Option value={5}>{t('role.dataScopeSelf')}</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="sort" label={t('role.sort')}>
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item
              name="status"
              label={t('role.status')}
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value={1}>{t('role.enabled')}</Radio>
                <Radio value={0}>{t('role.disabled')}</Radio>
              </Radio.Group>
            </Form.Item>
          </div>

          {/* 菜单权限 */}
          <Form.Item label={t('role.assignMenus')}>
            <Tree
              checkable
              checkedKeys={checkedKeys}
              onCheck={handleMenuCheck}
              treeData={menuTree}
              fieldNames={{ key: 'id', title: 'name', children: 'children' }}
              defaultExpandAll
              height={280}
              className="border rounded p-2"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
