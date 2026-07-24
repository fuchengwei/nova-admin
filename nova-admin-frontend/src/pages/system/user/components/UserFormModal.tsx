import {
  ModalForm,
  ProFormText,
  ProFormRadio,
  ProFormTreeSelect,
  ProFormCheckbox,
} from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import { phoneRule, emailRule } from '@/utils/validators';
import type { TreeSelectNode } from '@/utils/tree';
import type { UserRecord, UserUpdateRequest, UserCreateRequest } from '@/api/user';

export interface UserFormModalProps {
  open: boolean;
  editMode: boolean;
  record: UserRecord | null;
  roleOptions: { label: string; value: number }[];
  deptTreeData: TreeSelectNode[];
  onSubmit: (
    values: UserRecord,
    editMode: boolean,
    record: UserRecord | null,
  ) => Promise<boolean>;
  onClose: () => void;
}

/** 用户新增 / 编辑弹窗（页面局部组件） */
export default function UserFormModal({
  open,
  editMode,
  record,
  roleOptions,
  deptTreeData,
  onSubmit,
  onClose,
}: UserFormModalProps) {
  const { t } = useTranslation();

  return (
    <ModalForm<UserRecord>
      title={editMode ? t('user.editUser') : t('user.addUser')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      modalProps={{ destroyOnClose: true }}
      width={640}
      layout="vertical"
      initialValues={
        editMode && record ? { ...record, password: undefined } : { status: 1, gender: 0 }
      }
      onFinish={async (values) => onSubmit(values, editMode, record)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        {editMode && (
          <ProFormText
            name="account"
            label={t('user.account')}
            disabled
          />
        )}
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
        <ProFormText name="email" label={t('user.email')} rules={[emailRule(t('user.emailInvalid'))]} />
        <ProFormText name="phone" label={t('user.phone')} rules={[phoneRule(t('user.phoneInvalid'))]} />
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
            treeData: deptTreeData,
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
        <ProFormCheckbox.Group name="roleIds" label={t('user.role')} options={roleOptions} />
      </div>
    </ModalForm>
  );
}
