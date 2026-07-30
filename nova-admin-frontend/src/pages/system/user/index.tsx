import { useRef, useState } from 'react';
import { Button, Modal, Upload, type UploadProps } from 'antd';
import { message } from '@/utils/message';
import { DownloadOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { ProTable, type ActionType } from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getUserPage,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  updateUserStatus,
  exportUsers,
  getUserImportTemplate,
  importUsers,
  type UserImportResult,
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
  const latestQueryRef = useRef<UserPageParams>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UserRecord | null>(null);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdRecord, setPwdRecord] = useState<UserRecord | null>(null);
  const [importResult, setImportResult] = useState<UserImportResult | null>(null);

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
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (res) => {
      if (res.code !== 0) {
        message.error(res.msg || t('common.error'));
        return;
      }
      message.success(t('user.deleteSuccess'));
      actionRef.current?.reload();
    },
    onError: () => {
      message.error(t('common.error'));
    },
  });
  const resetPwdMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => resetPassword(id, password),
  });
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: number }) => updateUserStatus(id, status),
    onSuccess: () => {
      message.success(t('user.statusSuccess'));
      actionRef.current?.reload();
    },
    onError: () => {
      message.error(t('common.fail'));
    },
  });
  const importMutation = useMutation({
    mutationFn: importUsers,
    onSuccess: (res) => {
      if (res.code !== 0 || !res.data) {
        message.error(res.msg || t('common.error'));
        return;
      }
      actionRef.current?.reload();
      if (res.data.failed > 0) {
        setImportResult(res.data);
      } else {
        message.success(t('user.importSuccess', { count: res.data.success }));
      }
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

  const toUserPageParams = (params: Record<string, unknown>): UserPageParams => ({
    current: typeof params.current === 'number' ? params.current : 1,
    size: typeof params.pageSize === 'number' ? params.pageSize : 10,
    account: typeof params.account === 'string' ? params.account : undefined,
    nickname: typeof params.nickname === 'string' ? params.nickname : undefined,
    phone: typeof params.phone === 'string' ? params.phone : undefined,
    status: typeof params.status === 'number' ? params.status : undefined,
    deptId: typeof params.deptId === 'string' ? params.deptId : undefined,
  });

  const downloadFile = (content: Blob, fileName: string) => {
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleExport = async () => {
    try {
      downloadFile(await exportUsers(latestQueryRef.current), 'users.xlsx');
    } catch {
      message.error(t('common.error'));
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      downloadFile(await getUserImportTemplate(), 'user-import-template.xlsx');
    } catch {
      message.error(t('common.error'));
    }
  };

  const importUploadProps: UploadProps = {
    accept: '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    beforeUpload: (file) => {
      importMutation.mutate(file);
      return false;
    },
    showUploadList: false,
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className="mb-4 text-lg font-semibold">{t('menu.user')}</h2>
      <div ref={wrapperRef} className="min-h-0 flex-1">
        <div className="table-fill h-full">
          <ProTable<UserRecord>
            actionRef={actionRef}
            rowKey="id"
            headerTitle={t('menu.user')}
            columns={columns}
            style={{ height: '100%' }}
            scroll={{ x: 1100, y: scrollY }}
            request={async (params) => {
              const payload = toUserPageParams(params);
              latestQueryRef.current = payload;
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
              <Upload key="import" {...importUploadProps}>
                <Button icon={<UploadOutlined />} loading={importMutation.isPending}>
                  {t('user.importUsers')}
                </Button>
              </Upload>,
              <Button key="template" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
                {t('user.downloadImportTemplate')}
              </Button>,
              <Button key="export" icon={<DownloadOutlined />} onClick={handleExport}>
                {t('user.exportUsers')}
              </Button>,
            ]}
            options={{ reload: true, density: true, setting: true }}
            columnsState={{
              persistenceKey: 'user-table',
              persistenceType: 'localStorage',
            }}
          />
        </div>
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

      <Modal
        destroyOnHidden
        footer={null}
        onCancel={() => setImportResult(null)}
        open={importResult !== null}
        title={t('user.importResult')}
      >
        {importResult && (
          <div className="space-y-3">
            <div className="text-sm text-[color:var(--ant-color-text-secondary)]">
              {t('user.importSummary', {
                total: importResult.total,
                success: importResult.success,
                failed: importResult.failed,
              })}
            </div>
            <ul className="max-h-64 list-disc space-y-1 overflow-y-auto pl-5 text-sm">
              {importResult.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
