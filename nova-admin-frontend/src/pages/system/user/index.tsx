import { useRef, useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { PageContainer, ProTable, type ActionType } from '@ant-design/pro-components';
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
import { toTreeSelectData, type TreeSelectNode } from '@/utils/tree';
import UserFormModal from './components/UserFormModal';
import ResetPwdModal from './components/ResetPwdModal';
import { useUserColumns } from './components/columns';
import { useTableScrollY } from '@/hooks/useTableScrollY';

export default function UserPage() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UserRecord | null>(null);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdRecord, setPwdRecord] = useState<UserRecord | null>(null);

  const { data: deptTree } = useQuery({
    queryKey: ['deptTree'],
    queryFn: async () => {
      const res = await getDeptTree();
      return res.data ?? [];
    },
  });

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
    mutationFn: ({ id, password }: { id: number; password: string }) => resetPassword(id, password),
  });
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: number }) => updateUserStatus(id, status),
    onSuccess: () => {
      message.success(t('user.statusSuccess'));
      actionRef.current?.reload();
    },
    onError: () => {
      message.error(t('common.fail'));
    },
  });

  const deptTreeData: TreeSelectNode[] = toTreeSelectData(deptTree);
  const roleOptions = (roles ?? []).map((r) => ({ label: r.name, value: r.id }));

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

  const closeUserModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
    setEditMode(false);
  };

  const closePwdModal = () => {
    setPwdModalOpen(false);
    setPwdRecord(null);
  };

  const handleSubmitUser = async (
    values: UserRecord,
    isEdit: boolean,
    record: UserRecord | null,
  ): Promise<boolean> => {
    const res =
      isEdit && record
        ? await updateMutation.mutateAsync({
            ...values,
            id: record.id,
          } as unknown as UserUpdateRequest)
        : await createMutation.mutateAsync({ ...values } as unknown as UserCreateRequest);
    if (res.code !== 0) {
      message.error(res.msg || t('common.error'));
      return false;
    }
    message.success(isEdit ? t('user.updateSuccess') : t('user.createSuccess'));
    actionRef.current?.reload();
    return true;
  };

  const handleResetPwd = async (password: string, record: UserRecord | null): Promise<boolean> => {
    if (!record) return false;
    const res = await resetPwdMutation.mutateAsync({ id: record.id, password });
    if (res.code !== 0) {
      message.error(res.msg || t('common.error'));
      return false;
    }
    message.success(t('user.resetPwdSuccess'));
    return true;
  };

  const columns = useUserColumns({
    onEdit: handleOpenEdit,
    onResetPwd: handleOpenPwdModal,
    onDelete: (id) => deleteMutation.mutate(id),
    toggleStatus: (id, status) => toggleStatusMutation.mutate({ id, status }),
    toggleLoading: toggleStatusMutation.isPending,
  });

  const { wrapperRef, scrollY } = useTableScrollY();

  return (
    <PageContainer title={t('menu.user')} className="page-fill">
      <div ref={wrapperRef} className="flex min-h-0 flex-1 flex-col">
        <ProTable<UserRecord>
          actionRef={actionRef}
          rowKey="id"
          headerTitle={t('menu.user')}
          columns={columns}
          style={{ height: '100%' }}
          scroll={{ x: 1100, y: scrollY }}
          request={async (params) => {
            const payload: UserPageParams = {
              current: params.current ?? 1,
              size: params.pageSize ?? 10,
              account: params.account,
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
      </div>

      <UserFormModal
        open={modalOpen}
        editMode={editMode}
        record={editingRecord}
        roleOptions={roleOptions}
        deptTreeData={deptTreeData}
        onSubmit={handleSubmitUser}
        onClose={closeUserModal}
      />

      <ResetPwdModal
        open={pwdModalOpen}
        record={pwdRecord}
        onSubmit={handleResetPwd}
        onClose={closePwdModal}
      />
    </PageContainer>
  );
}
