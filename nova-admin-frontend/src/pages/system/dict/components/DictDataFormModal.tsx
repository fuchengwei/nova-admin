import { ModalForm, ProFormDigit, ProFormRadio, ProFormText } from '@ant-design/pro-components';
import { useTranslation } from 'react-i18next';
import type { DictDataRecord } from '@/api/dict';

export interface DictDataFormValues {
  label: string;
  value: string;
  cssClass?: string;
  sort?: number;
  status: number;
  defaultFlag: number;
}

export interface DictDataFormModalProps {
  open: boolean;
  editMode: boolean;
  record: DictDataRecord | null;
  onSubmit: (
    values: DictDataFormValues,
    editMode: boolean,
    record: DictDataRecord | null,
  ) => Promise<boolean>;
  onClose: () => void;
}

/** 字典数据新增 / 编辑弹窗（页面局部组件） */
export default function DictDataFormModal({
  open,
  editMode,
  record,
  onSubmit,
  onClose,
}: DictDataFormModalProps) {
  const { t } = useTranslation();

  return (
    <ModalForm<DictDataFormValues>
      title={editMode ? t('dict.editData') : t('dict.addData')}
      open={open}
      onOpenChange={(visible) => {
        if (!visible) onClose();
      }}
      modalProps={{ destroyOnHidden: true }}
      width={640}
      layout="vertical"
      initialValues={
        editMode && record
          ? {
              label: record.label,
              value: record.value,
              cssClass: record.cssClass,
              sort: record.sort,
              status: record.status,
              defaultFlag: record.defaultFlag,
            }
          : { status: 1, defaultFlag: 0, sort: 0 }
      }
      onFinish={async (values) => onSubmit(values, editMode, record)}
    >
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <ProFormText
          name="label"
          label={t('dict.dataLabel')}
          rules={[{ required: true, message: t('dict.dataLabelRequired') }]}
        />
        <ProFormText
          name="value"
          label={t('dict.dataValue')}
          rules={[{ required: true, message: t('dict.dataValueRequired') }]}
        />
        <ProFormText name="cssClass" label={t('dict.cssClass')} />
        <ProFormDigit name="sort" label={t('dict.sort')} min={0} />
        <ProFormRadio.Group
          name="status"
          label={t('dict.status')}
          rules={[{ required: true }]}
          options={[
            { label: t('dict.enabled'), value: 1 },
            { label: t('dict.disabled'), value: 0 },
          ]}
        />
        <ProFormRadio.Group
          name="defaultFlag"
          label={t('dict.defaultFlag')}
          rules={[{ required: true }]}
          options={[
            { label: t('dict.yes'), value: 1 },
            { label: t('dict.no'), value: 0 },
          ]}
        />
      </div>
    </ModalForm>
  );
}
