import { useCallback, useRef, useState } from 'react';
import { Button, Switch, Popconfirm, message } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormRadio,
  ProFormTreeSelect,
  ProFormCheckbox,
  type ProColumns,
  type ActionType,
} from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
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

export default function UserPage() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UserRecord | null>(null);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdRecord, setPwdRecord] = useState<UserRecord | null>(null);

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

  const createMutation = useMutation({ mutationFn: createUser });
  const updateMutation = useMutation({ mutationFn: updateUser });
  const deleteMutation = useMutation({ mutationFn: deleteUser });
  const resetPwdMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      resetPassword(id, password),
  });
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) =>
      updateUserStatus(id, status),
  });

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
    [deptTree],
  );

  const treeSelectData = buildTreeSelectData(deptTree);

  const handleOpenAdd = () => {
    setEditMode(false);
    setEditingRecord(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (record: UserRecord) => {
    setEditMode(true);
    setEditingRecord(record);
    setModalOpen(true);
  };

  const handleOpenPwdModal = (record: UserRecord) => {
    setPwdRecord(record);
    setPwdModalOpen(true);
  };

  const columns: ProColumns<UserRecord>[] = [
    { title: t('user.username'), dataIndex: 'username', width: 120, ellipsis: true },
    { title: t('user.nickname'), dataIndex: 'nickname', width: 120, ellipsis: true },
    {
      title: t('user.dept'),
      dataIndex: 'deptName',
      width: 140,
      search: false,
      render: (v) => v || '-',
    },
    {
      title: t('user.phone'),
      dataIndex: 'phone',
      width: 130,
      ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: t('user.status'),
      dataIndex: 'status',
      width: 110,
      valueType: 'select',
      valueEnum: {
        1: { text: t('user.enabled'), status: 'Success' },
        0: { text: t('user.disabled'), status: 'Error' },
      },
      render: (_, record) => (
        <Switch
          checked={record.status === 1}
          checkedChildren={t('user.enabled')}
          unCheckedChildren={t('user.disabled')}
          loading={toggleStatusMutation.isPending}
          onChange={(checked) =>
            toggleStatusMutation.mutate({ id: record.id, status: checked ? 1 : 0 })
          }
        />
      ),
    },
    {
      title: t('user.createTime'),
      dataIndex: 'createTime',
      width: 180,
      valueType: 'dateTime',
      search: false,
      render: (v) => v || '-',
    },
    {
      title: t('common.action'),
      valueType: 'option',
      key: 'option',
      width: 220,
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
        <Button key="pwd" type="link" size="small" onClick={() => handleOpenPwdModal(record)}>
          {t('user.resetPwd')}
        </Button>,
        <Popconfirm
          key="del"
          title={t('user.deleteConfirm')}
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

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">{t('menu.user')}</h2>

      <ProTable<UserRecord>
        actionRef={actionRef}
        rowKey="id"
        headerTitle={t('menu.user')}
        columns={columns}
        scroll={{ x: 1100 }}
        request={async (params) => {
          const payload: UserPageParams = {
            current: params.current ?? 1,
            size: params.pageSize ?? 10,
            username: params.username,
            nickname: params.nickname,
            phone: params.phone,
            status: params.status,
            deptId: params.deptId,
          };
          const res = await getUserPage(payload);
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
            {t('user.addUser')}
          </Button>,
        ]}
        options={{ reload: true, density: true, setting: true }}
        columnsState={{
          persistenceKey: 'user-table',
          persistenceType: 'localStorage',
        }}
      />

      {/* 新增/编辑弹窗 */}
      <ModalForm<UserRecord>
        title={editMode ? t('user.editUser') : t('user.addUser')}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingRecord(null);
        }}
        width={640}
        layout="vertical"
        initialValues={
          editMode && editingRecord
            ? { ...editingRecord, password: undefined }
            : { status: 1, gender: 0 }
        }
        onFinish={async (values) => {
          const res = editMode && editingRecord
            ? await updateMutation.mutateAsync({ ...values } as unknown as UserUpdateRequest)
            : await createMutation.mutateAsync({ ...values } as unknown as UserCreateRequest);
          if (res.code !== 0) {
            message.error(res.msg || t('common.error'));
            return false;
          }
          message.success(editMode ? t('user.updateSuccess') : t('user.createSuccess'));
          actionRef.current?.reload();
          return true;
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <ProFormText
            name="username"
            label={t('user.username')}
            disabled={editMode}
            rules={[{ required: true, message: t('user.usernameRequired') }]}
          />
          <ProFormText.Password
            name="password"
            label={t('user.password')}
            placeholder={editMode ? t('user.passwordHint') : t('user.password')}
            rules={[
              { required: !editMode, message: t('user.passwordRequired') },
              { min: 6, message: t('user.passwordMinLen') },
            ]}
          />
          <ProFormText name="nickname" label={t('user.nickname')} />
          <ProFormText name="realName" label={t('user.realName')} />
          <ProFormText
            name="email"
            label={t('user.email')}
            rules={[{ type: 'email', message: t('user.emailInvalid') }]}
          />
          <ProFormText name="phone" label={t('user.phone')} />
          <ProFormRadio.Group
            name="gender"
            label={t('user.gender')}
            options={[
              { label: t('user.genderUnknown'), value: 0 },
              { label: t('user.genderMale'), value: 1 },
              { label: t('user.genderFemale'), value: 2 },
            ]}
          />
          <ProFormTreeSelect
            name="deptId"
            label={t('user.dept')}
            fieldProps={{
              treeData: treeSelectData,
              allowClear: true,
              treeDefaultExpandAll: true,
              placeholder: t('user.deptSelect'),
            }}
          />
          <ProFormRadio.Group
            name="status"
            label={t('user.status')}
            rules={[{ required: true }]}
            options={[
              { label: t('user.enabled'), value: 1 },
              { label: t('user.disabled'), value: 0 },
            ]}
          />
          <ProFormCheckbox.Group
            name="roleIds"
            label={t('user.role')}
            options={roles?.map((r) => ({ label: r.name, value: r.id })) ?? []}
          />
        </div>
      </ModalForm>

      {/* 重置密码弹窗 */}
      <ModalForm
        title={t('user.resetPwd')}
        open={pwdModalOpen}
        onOpenChange={(open) => {
          setPwdModalOpen(open);
          if (!open) setPwdRecord(null);
        }}
        width={400}
        layout="vertical"
        onFinish={async (values) => {
          if (!pwdRecord) return false;
          const res = await resetPwdMutation.mutateAsync({
            id: pwdRecord.id,
            password: values.password as string,
          });
          if (res.code !== 0) {
            message.error(res.msg || t('common.error'));
            return false;
          }
          message.success(t('user.resetPwdSuccess'));
          return true;
        }}
      >
        <ProFormText.Password
          name="password"
          label={t('user.newPassword')}
          rules={[
            { required: true, message: t('user.passwordRequired') },
            { min: 6, message: t('user.passwordMinLen') },
          ]}
        />
      </ModalForm>
    </div>
  );
}
