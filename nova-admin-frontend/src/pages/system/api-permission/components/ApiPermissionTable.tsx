import { useRef, useState } from 'react';
import { SyncOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { ProTable, type ActionType } from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  getApiPermissions,
  getApiPermissionUsers,
  syncApiPermissions,
  updateApiPermissionAccess,
  type ApiPermissionRecord,
} from '@/api/menu';
import { getAllRoles } from '@/api/role';
import { useTableScrollY } from '@/hooks/useTableScrollY';
import { message } from '@/utils/message';
import layoutStyles from '@/styles/layout.module.css';

import ApiPermissionRoleModal from './ApiPermissionRoleModal';
import { getApiPermissionColumns, type ApiPermissionTableRow } from './columns';

interface ApiPermissionTableProps {
  canEdit: boolean;
}

export default function ApiPermissionTable({ canEdit }: ApiPermissionTableProps) {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [records, setRecords] = useState<ApiPermissionRecord[]>([]);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [activePermission, setActivePermission] = useState<ApiPermissionRecord | null>(null);
  const [publicAccess, setPublicAccess] = useState(false);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const syncMutation = useMutation({ mutationFn: syncApiPermissions });
  const accessMutation = useMutation({ mutationFn: updateApiPermissionAccess });
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roleAll'],
    enabled: canEdit,
    queryFn: async () => {
      const result = await getAllRoles();
      return result.code === 0 ? result.data : [];
    },
  });
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['apiPermission', 'users'],
    enabled: canEdit,
    queryFn: async () => {
      const result = await getApiPermissionUsers();
      return result.code === 0 ? result.data : [];
    },
  });

  const roleOptions = roles.map((role) => ({
    label: `${role.name} (${role.code})`,
    value: role.id,
  }));
  const roleLabels = new Map(roleOptions.map((role) => [role.value, role.label]));
  const userOptions = users.map((user) => ({ label: user.label, value: user.id }));
  const userLabels = new Map(userOptions.map((user) => [user.value, user.label]));

  const openAccessModal = (record: ApiPermissionRecord) => {
    setActivePermission(record);
    setPublicAccess(record.publicAccess);
    setSelectedRoleIds(record.roleIds ?? []);
    setSelectedUserIds(record.userIds ?? []);
    setAccessModalOpen(true);
  };

  const closeAccessModal = () => {
    setAccessModalOpen(false);
    setActivePermission(null);
  };

  const saveAccess = () => {
    if (!activePermission) return;
    accessMutation.mutate(
      {
        permission: activePermission.permission,
        publicAccess,
        roleIds: selectedRoleIds,
        userIds: selectedUserIds,
      },
      {
        onSuccess: (result) => {
          if (result.code !== 0) {
            message.error(result.msg || t('common.error'));
            return;
          }
          setRecords((current) =>
            current.map((item) =>
              item.permission === activePermission.permission
                ? {
                    ...item,
                    publicAccess,
                    roleIds: selectedRoleIds,
                    userIds: selectedUserIds,
                  }
                : item,
            ),
          );
          message.success(t('menu.apiPermissionAccessUpdateSuccess'));
          closeAccessModal();
          actionRef.current?.reload();
        },
      },
    );
  };

  const sync = () => {
    const permissions = records
      .filter((record) => record.status === 'SYNCABLE')
      .map((record) => record.permission);
    syncMutation.mutate(permissions, {
      onSuccess: (result) => {
        if (result.code !== 0) {
          message.error(result.msg || t('common.error'));
          return;
        }
        message.success(t('menu.apiPermissionSyncSuccess', { count: result.data }));
        actionRef.current?.reload();
      },
    });
  };

  const columns = getApiPermissionColumns({
    t,
    roleLabels,
    userLabels,
    canEdit,
    rolesLoading,
    usersLoading,
    accessMutationPending: accessMutation.isPending,
    onConfigure: openAccessModal,
  });
  const { wrapperRef, scrollY } = useTableScrollY();

  return (
    <>
      <div ref={wrapperRef} className={`${layoutStyles.tableFill} h-full min-h-0`}>
        <ProTable<ApiPermissionTableRow>
          actionRef={actionRef}
          rowKey="rowKey"
          columns={columns}
          style={{ height: '100%' }}
          scroll={{ x: 1300, y: scrollY }}
          request={async (params) => {
            const result = await getApiPermissions();
            const data = result.code === 0 ? result.data : [];
            const rows = data.flatMap((record) =>
              record.endpoints.map((endpoint) => ({
                ...record,
                ...endpoint,
                rowKey: `${record.permission}-${endpoint.method}-${endpoint.path}`,
              })),
            );
            setRecords(data);
            const pathFilter =
              typeof params.path === 'string' ? params.path.trim().toLowerCase() : '';
            const permissionFilter =
              typeof params.permission === 'string' ? params.permission.trim().toLowerCase() : '';
            const methodFilter = typeof params.method === 'string' ? params.method : '';
            const statusFilter = typeof params.status === 'string' ? params.status : '';
            const filteredRows = rows.filter((row) => {
              const pathMatches = !pathFilter || row.path.toLowerCase().includes(pathFilter);
              const permissionMatches =
                !permissionFilter || row.permission.toLowerCase().includes(permissionFilter);
              const methodMatches = !methodFilter || row.method === methodFilter;
              const statusMatches = !statusFilter || row.status === statusFilter;
              return pathMatches && permissionMatches && methodMatches && statusMatches;
            });
            return {
              data: filteredRows,
              success: result.code === 0,
              total: filteredRows.length,
            };
          }}
          search={{ labelWidth: 'auto' }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          toolBarRender={() => [
            <Button
              key="sync"
              type="primary"
              icon={<SyncOutlined />}
              disabled={!canEdit || !records.some((record) => record.status === 'SYNCABLE')}
              loading={syncMutation.isPending}
              onClick={sync}
            >
              {t('menu.apiPermissionSync')}
            </Button>,
          ]}
          options={{ reload: true, density: true, setting: true }}
        />
      </div>
      <ApiPermissionRoleModal
        open={accessModalOpen}
        permission={activePermission}
        publicAccess={publicAccess}
        selectedRoleIds={selectedRoleIds}
        selectedUserIds={selectedUserIds}
        roleOptions={roleOptions}
        userOptions={userOptions}
        rolesLoading={rolesLoading}
        usersLoading={usersLoading}
        pending={accessMutation.isPending}
        onPublicAccessChange={setPublicAccess}
        onRoleIdsChange={setSelectedRoleIds}
        onUserIdsChange={setSelectedUserIds}
        onCancel={closeAccessModal}
        onSave={saveAccess}
      />
    </>
  );
}
