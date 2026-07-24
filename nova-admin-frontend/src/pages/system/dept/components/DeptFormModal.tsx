import { useMemo } from 'react';
import {
  ModalForm,
  ProFormText,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormTreeSelect,
} from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { phoneRule, emailRule } from '@/utils/validators';
import type { TreeSelectNode } from '@/utils/tree';
import type { DeptTreeNode } from '@/api/dept';
import { getUserPage } from '@/api/user';

/** 部门表单值（parentId 为空表示根部门，提交时由调用方转为 0） */
export interface DeptFormValues {
  parentId?: number;
  name: string;
  code?: string;
  leader?: string;
  phone?: string;
  email?: string;
  sort?: number;
  status?: number;
}

export interface DeptFormModalProps {
  open: boolean;
  editMode: boolean;
  record: DeptTreeNode | null;
  /** 新增模式下的上级部门 ID（undefined 表示新增根部门） */
  addParentId?: number;
  /** 上级部门下拉树数据（编辑时为排除自身后的树） */
  parentOptions: TreeSelectNode[];
  onSubmit: (
    values: DeptFormValues,
    editMode: boolean,
    record: DeptTreeNode | null,
  ) => Promise<boolean>;
  onClose: () => void;
}

/** 部门新增 / 编辑弹窗（页面局部组件） */
export default function DeptFormModal({
  open,
  editMode,
  record,
  addParentId,
  parentOptions,
  onSubmit,
  onClose,
}: DeptFormModalProps) {
  const { t } = useTranslation();

  // 获取启用用户列表作为负责人下拉选项
  const { data: userPage } = useQuery({
    queryKey: ['leaderOptions'],
    queryFn: async () => {
      const res = await getUserPage({ current: 1, size: 1000, status: 1 });
      return res.data?.records ?? [];
    },
  });

  // 确保当前编辑部门的负责人值能被回显
  const leaderOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { label: string; value: string }[] = [];
    const currentLeader = editMode && record ? record.leader : undefined;
    if (currentLeader && !seen.has(currentLeader)) {
      seen.add(currentLeader);
      list.push({ label: currentLeader, value: currentLeader });
    }
    for (const u of userPage ?? []) {
      const name = u.realName || u.nickname || u.account;
      if (name && !seen.has(name)) {
        seen.add(name);
        list.push({ label: name, value: name });
      }
    }
    return list;
  }, [userPage, editMode, record]);

  // 上级部门树追加根部门节点：根部门 ID 为 0，直接展示为「根部门」而非 "0"
  const parentTreeData = useMemo<TreeSelectNode[]>(
    () => [{ value: 0, title: t('dept.rootDept'), children: parentOptions }],
    [t, parentOptions],
  );

  return (
    <ModalForm<DeptFormValues>
      title={editMode ? t('dept.editTitle') : t('dept.addTitle')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      width={640}
      layout="vertical"
      initialValues={
        editMode && record
          ? {
              parentId: record.parentId,
              name: record.name,
              code: record.code,
              leader: record.leader,
              phone: record.phone,
              email: record.email,
              sort: record.sort,
              status: record.status,
            }
          : {
              parentId: addParentId ?? 0,
              sort: 0,
              status: 1,
            }
      }
      onFinish={async (values) => onSubmit(values, editMode, record)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <ProFormTreeSelect
          name="parentId"
          label={t('dept.parent')}
          fieldProps={{
            treeData: parentTreeData,
            allowClear: true,
            treeDefaultExpandAll: true,
            placeholder: t('dept.selectParent'),
          }}
        />
        <ProFormText
          name="name"
          label={t('dept.name')}
          rules={[{ required: true, message: t('dept.nameRequired') }]}
        />
        <ProFormText name="code" label={t('dept.code')} />
        <ProFormSelect
          name="leader"
          label={t('dept.leader')}
          options={leaderOptions}
          fieldProps={{
            showSearch: true,
            optionFilterProp: 'label',
            placeholder: t('dept.leaderSelect'),
            allowClear: true,
          }}
        />
        <ProFormText
          name="phone"
          label={t('dept.phone')}
          rules={[phoneRule(t('dept.phoneInvalid'))]}
        />
        <ProFormText
          name="email"
          label={t('dept.email')}
          rules={[emailRule(t('dept.emailInvalid'))]}
        />
        <ProFormDigit name="sort" label={t('dept.sort')} min={0} />
        <ProFormRadio.Group
          name="status"
          label={t('dept.status')}
          rules={[{ required: true }]}
          options={[
            { label: t('dept.enabled'), value: 1 },
            { label: t('dept.disabled'), value: 0 },
          ]}
        />
      </div>
    </ModalForm>
  );
}
