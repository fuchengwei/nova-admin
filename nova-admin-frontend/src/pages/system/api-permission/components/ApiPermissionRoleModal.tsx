import {
  ApiOutlined,
  CheckCircleFilled,
  GlobalOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Modal, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';

import type { ApiPermissionRecord } from '@/api/menu';

interface ApiPermissionRoleModalProps {
  open: boolean;
  permission: ApiPermissionRecord | null;
  publicAccess: boolean;
  selectedRoleIds: string[];
  selectedUserIds: string[];
  roleOptions: { label: string; value: string }[];
  userOptions: { label: string; value: string }[];
  rolesLoading: boolean;
  usersLoading: boolean;
  pending: boolean;
  onPublicAccessChange: (publicAccess: boolean) => void;
  onRoleIdsChange: (roleIds: string[]) => void;
  onUserIdsChange: (userIds: string[]) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function ApiPermissionRoleModal({
  open,
  permission,
  publicAccess,
  selectedRoleIds,
  selectedUserIds,
  roleOptions,
  userOptions,
  rolesLoading,
  usersLoading,
  pending,
  onPublicAccessChange,
  onRoleIdsChange,
  onUserIdsChange,
  onCancel,
  onSave,
}: ApiPermissionRoleModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-accent-soft)] text-[var(--ant-color-primary)]">
            <ApiOutlined />
          </span>
          <div className="min-w-0">
            <div className="text-base font-semibold text-[var(--color-text-primary)]">
              {t('menu.apiPermissionConfigureAccess')}
            </div>
            <code className="mt-1 block truncate font-mono text-xs font-normal text-[var(--color-text-secondary)]">
              {permission?.permission}
            </code>
          </div>
        </div>
      }
      open={open}
      width={640}
      destroyOnHidden
      confirmLoading={pending}
      okText={t('menu.apiPermissionSaveAccess')}
      cancelText={t('common.cancel')}
      onCancel={onCancel}
      onOk={onSave}
    >
      <div className="space-y-4">
        <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-3 text-sm leading-5 text-[var(--color-text-secondary)]">
          {t('menu.apiPermissionAccessModalHint')}
        </div>

        <section aria-labelledby="api-permission-access-mode">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              {t('menu.apiPermissionAccessMode')}
            </span>
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <div
            className={`flex items-center justify-between gap-4 rounded-md border px-3.5 py-3 transition-colors ${
              publicAccess
                ? 'border-emerald-500/60 bg-emerald-500/10'
                : 'border-[var(--color-border)] bg-[var(--color-surface)]'
            }`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                  publicAccess
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]'
                }`}
              >
                {publicAccess ? <CheckCircleFilled /> : <GlobalOutlined />}
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-[var(--color-text-primary)]">
                  {t('menu.apiPermissionPublicAccess')}
                </div>
                <div className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                  {t('menu.apiPermissionPublicAccessHint')}
                </div>
              </div>
            </div>
            <Switch checked={publicAccess} onChange={onPublicAccessChange} />
          </div>
        </section>

        <section aria-labelledby="api-permission-targeted-access">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-[0.12em] text-slate-400 uppercase">
              {t('menu.apiPermissionTargetedAccess')}
            </span>
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                  <TeamOutlined className="text-[var(--ant-color-primary)]" />
                  {t('menu.apiPermissionRoles')}
                </div>
                <span className="font-mono text-xs text-[var(--color-text-muted)]">
                  {t('menu.apiPermissionSelectedCount', { count: selectedRoleIds.length })}
                </span>
              </div>
              <Select
                mode="multiple"
                value={selectedRoleIds}
                options={roleOptions}
                loading={rolesLoading}
                className="w-full"
                placeholder={t('menu.apiPermissionAssignRoles')}
                maxTagCount="responsive"
                showSearch
                optionFilterProp="label"
                notFoundContent={
                  rolesLoading ? t('common.loading') : t('menu.apiPermissionNoRoles')
                }
                onChange={(values) => onRoleIdsChange(values.map(String))}
              />
            </div>
            <div className="rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                  <UserOutlined className="text-cyan-400" />
                  {t('menu.apiPermissionUsers')}
                </div>
                <span className="font-mono text-xs text-[var(--color-text-muted)]">
                  {t('menu.apiPermissionSelectedCount', { count: selectedUserIds.length })}
                </span>
              </div>
              <Select
                mode="multiple"
                value={selectedUserIds}
                options={userOptions}
                loading={usersLoading}
                className="w-full"
                placeholder={t('menu.apiPermissionAssignUsers')}
                maxTagCount="responsive"
                showSearch
                optionFilterProp="label"
                notFoundContent={
                  usersLoading ? t('common.loading') : t('menu.apiPermissionNoUsers')
                }
                onChange={(values) => onUserIdsChange(values.map(String))}
              />
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
