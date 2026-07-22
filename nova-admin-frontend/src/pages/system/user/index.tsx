import { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Switch,
  Modal,
  Form,
  Input,
  Radio,
  Select,
  TreeSelect,
  Checkbox,
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
  getUserPage,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  updateUserStatus,
  type UserRecord,
  type UserPageParams,
  type UserCreateRequest,
  type UserUpdateRequest,
} from '@/api/user';
import { getDeptTree } from '@/api/dept';
import { getAllRoles } from '@/api/role';

const QUERY_KEY = ['userPage'];

export default function UserPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [searchForm] = Form.useForm();

  const [pageParams, setPageParams] = useState<UserPageParams>({ current: 1, size: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UserRecord | null>(null);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdRecord, setPwdRecord] = useState<UserRecord | null>(null);
  const [pwdForm] = Form.useForm();

  // 查询用户分页
  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEY, pageParams],
    queryFn: async () => {
      const res = await getUserPage(pageParams);
      return res.data;
    },
  });

  // 部门树（TreeSelect 用）
  const { data: deptTree } = useQuery({
    queryKey: ['deptTree'],
    queryFn: async () => {
      const res = await getDeptTree();
      return res.data ?? [];
    },
  });

  // 角色列表
  const { data: roles } = useQuery({
    queryKey: ['allRoles'],
    queryFn: async () => {
      const res = await getAllRoles();
      return res.data ?? [];
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('user.createSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        handleCloseModal();
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('user.updateSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        handleCloseModal();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('user.deleteSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });

  const resetPwdMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      resetPassword(id, password),
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('user.resetPwdSuccess'));
        setPwdModalOpen(false);
        setPwdRecord(null);
        pwdForm.resetFields();
      }
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) =>
      updateUserStatus(id, status),
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('user.statusSuccess'));
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      }
    },
  });

  const handleOpenAdd = () => {
    setEditMode(false);
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: 1, gender: 0 });
    setModalOpen(true);
  };

  const handleOpenEdit = (record: UserRecord) => {
    setEditMode(true);
    setEditingRecord(record);
    form.resetFields();
    form.setFieldsValue({
      username: record.username,
      nickname: record.nickname,
      realName: record.realName,
      email: record.email,
      phone: record.phone,
      gender: record.gender,
      deptId: record.deptId,
      status: record.status,
      roleIds: record.roleIds ?? [],
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    form.resetFields();
    setEditingRecord(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editMode && editingRecord) {
        const data: UserUpdateRequest = { id: editingRecord.id, ...values };
        updateMutation.mutate(data);
      } else {
        const data: UserCreateRequest = { ...values };
        createMutation.mutate(data);
      }
    } catch {
      // validation failed
    }
  };

  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    // 清除空字符串，避免传给后端
    const params: UserPageParams = { current: 1, size: pageParams.size };
    if (values.username) params.username = values.username;
    if (values.nickname) params.nickname = values.nickname;
    if (values.phone) params.phone = values.phone;
    if (values.status !== undefined && values.status !== null && values.status !== '')
      params.status = values.status;
    if (values.deptId !== undefined && values.deptId !== null) params.deptId = values.deptId;
    setPageParams(params);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPageParams({ current: 1, size: 10 });
  };

  const handleOpenPwdModal = (record: UserRecord) => {
    setPwdRecord(record);
    pwdForm.resetFields();
    setPwdModalOpen(true);
  };

  const handlePwdSubmit = async () => {
    try {
      const values = await pwdForm.validateFields();
      if (pwdRecord) {
        resetPwdMutation.mutate({ id: pwdRecord.id, password: values.password });
      }
    } catch {
      // validation failed
    }
  };

  // 将部门树转为 TreeSelect 数据
  const buildTreeSelectData = useCallback(
    (
      data: typeof deptTree,
    ): { value: number; title: string; children?: ReturnType<typeof buildTreeSelectData> }[] => {
      if (!data) return [];
      return data.map((item) => ({
        value: item.id,
        title: item.name,
        children: item.children ? buildTreeSelectData(item.children) : undefined,
      }));
    },
    [],
  );

  const treeSelectData = buildTreeSelectData(deptTree);

  const columns = [
    {
      title: t('user.username'),
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: t('user.nickname'),
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
    },
    {
      title: t('user.dept'),
      dataIndex: 'deptName',
      key: 'deptName',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: t('user.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (v: string) => v || '-',
    },
    {
      title: t('user.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number, record: UserRecord) => (
        <Switch
          checked={v === 1}
          checkedChildren={t('user.enabled')}
          unCheckedChildren={t('user.disabled')}
          onChange={(checked) =>
            toggleStatusMutation.mutate({ id: record.id, status: checked ? 1 : 0 })
          }
          loading={toggleStatusMutation.isPending}
        />
      ),
    },
    {
      title: t('user.createTime'),
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (v: string) => v || '-',
    },
    {
      title: t('user.action'),
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, record: UserRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          >
            {t('common.edit')}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleOpenPwdModal(record)}
          >
            {t('user.resetPwd')}
          </Button>
          <Popconfirm
            title={t('user.deleteConfirm')}
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
      <h2 className="text-lg font-semibold mb-4">{t('menu.user')}</h2>

      {/* 搜索栏 */}
      <Card className="mb-4" styles={{ body: { padding: '16px' } }}>
        <Form form={searchForm} layout="inline" className="flex flex-wrap gap-2">
          <Form.Item name="username" label={t('user.username')}>
            <Input placeholder={t('user.username')} allowClear />
          </Form.Item>
          <Form.Item name="nickname" label={t('user.nickname')}>
            <Input placeholder={t('user.nickname')} allowClear />
          </Form.Item>
          <Form.Item name="phone" label={t('user.phone')}>
            <Input placeholder={t('user.phone')} allowClear />
          </Form.Item>
          <Form.Item name="status" label={t('user.status')}>
            <Select placeholder={t('user.status')} allowClear style={{ width: 120 }}>
              <Select.Option value={1}>{t('user.enabled')}</Select.Option>
              <Select.Option value={0}>{t('user.disabled')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="deptId" label={t('user.dept')}>
            <TreeSelect
              treeData={treeSelectData}
              placeholder={t('user.dept')}
              allowClear
              treeDefaultExpandAll
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
              >
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
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
              {t('user.addUser')}
            </Button>
          </Space>
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
          scroll={{ x: 1100 }}
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
        title={editMode ? t('user.editUser') : t('user.addUser')}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        confirmLoading={submitting}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item
              name="username"
              label={t('user.username')}
              rules={[{ required: true, message: t('user.usernameRequired') }]}
            >
              <Input placeholder={t('user.username')} disabled={editMode} />
            </Form.Item>

            <Form.Item
              name="password"
              label={t('user.password')}
              rules={[
                { required: !editMode, message: t('user.passwordRequired') },
                { min: 6, message: t('user.passwordMinLen') },
              ]}
            >
              <Input.Password
                placeholder={editMode ? t('user.passwordHint') : t('user.password')}
              />
            </Form.Item>

            <Form.Item name="nickname" label={t('user.nickname')}>
              <Input placeholder={t('user.nickname')} />
            </Form.Item>

            <Form.Item name="realName" label={t('user.realName')}>
              <Input placeholder={t('user.realName')} />
            </Form.Item>

            <Form.Item
              name="email"
              label={t('user.email')}
              rules={[{ type: 'email', message: t('user.emailInvalid') }]}
            >
              <Input placeholder={t('user.email')} />
            </Form.Item>

            <Form.Item name="phone" label={t('user.phone')}>
              <Input placeholder={t('user.phone')} />
            </Form.Item>

            <Form.Item name="gender" label={t('user.gender')}>
              <Radio.Group>
                <Radio value={0}>{t('user.genderUnknown')}</Radio>
                <Radio value={1}>{t('user.genderMale')}</Radio>
                <Radio value={2}>{t('user.genderFemale')}</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="deptId" label={t('user.dept')}>
              <TreeSelect
                treeData={treeSelectData}
                placeholder={t('user.deptSelect')}
                treeDefaultExpandAll
                allowClear
              />
            </Form.Item>

            <Form.Item
              name="status"
              label={t('user.status')}
              rules={[{ required: true }]}
            >
              <Radio.Group>
                <Radio value={1}>{t('user.enabled')}</Radio>
                <Radio value={0}>{t('user.disabled')}</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="roleIds" label={t('user.role')}>
              <Checkbox.Group
                options={
                  roles?.map((r) => ({ label: r.name, value: r.id })) ?? []
                }
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal
        title={t('user.resetPwd')}
        open={pwdModalOpen}
        onOk={handlePwdSubmit}
        onCancel={() => {
          setPwdModalOpen(false);
          setPwdRecord(null);
          pwdForm.resetFields();
        }}
        confirmLoading={resetPwdMutation.isPending}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnClose
        width={400}
      >
        <Form form={pwdForm} layout="vertical" className="mt-4">
          <Form.Item
            name="password"
            label={t('user.newPassword')}
            rules={[
              { required: true, message: t('user.passwordRequired') },
              { min: 6, message: t('user.passwordMinLen') },
            ]}
          >
            <Input.Password placeholder={t('user.password')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
