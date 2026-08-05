import { Modal, Select } from 'antd';
import { useTranslation } from 'react-i18next';

import type { ApiPermissionRecord } from '@/api/menu';

interface ApiPermissionRoleModalProps {
  open: boolean;
  permission: ApiPermissionRecord | null;
  selectedRoleIds: string[];
  roleOptions: { label: string; value: string }[];
  rolesLoading: boolean;
  pending: boolean;
  onRoleIdsChange: (roleIds: string[]) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function ApiPermissionRoleModal({
  open,
  permission,
  selectedRoleIds,
  roleOptions,
  rolesLoading,
  pending,
  onRoleIdsChange,
  onCancel,
  onSave,
}: ApiPermissionRoleModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      title={
        <div>
          <div>{t('menu.apiPermissionConfigureRoles')}</div>
          <code className="text-xs font-normal text-slate-500">{permission?.permission}</code>
        </div>
      }
      open={open}
      width={520}
      destroyOnHidden
      confirmLoading={pending}
      okText={t('common.save')}
      cancelText={t('common.cancel')}
      onCancel={onCancel}
      onOk={onSave}
    >
      <div className="border-b border-slate-200 pb-3 text-sm text-slate-500">
        {t('menu.apiPermissionRoleModalHint')}
      </div>
      <Select
        mode="multiple"
        value={selectedRoleIds}
        options={roleOptions}
        loading={rolesLoading}
        className="mt-4 w-full"
        placeholder={t('menu.apiPermissionAssignRole')}
        maxTagCount="responsive"
        showSearch
        optionFilterProp="label"
        notFoundContent={rolesLoading ? t('common.loading') : t('menu.apiPermissionNoRoles')}
        onChange={(values) => onRoleIdsChange(values.map(String))}
      />
    </Modal>
  );
}
