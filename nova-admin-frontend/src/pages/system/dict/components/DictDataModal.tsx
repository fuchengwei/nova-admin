import { useRef, useState } from 'react';
import { Button, Modal, Popconfirm, Tag, Typography } from 'antd';
import { message } from '@/utils/message';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { ProTable, type ActionType, type ProColumns } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  createDictData,
  deleteDictData,
  getDictDataPage,
  updateDictData,
  type DictDataCreateRequest,
  type DictDataRecord,
  type DictDataUpdateRequest,
  type DictTypeRecord,
} from '@/api/dict';
import { displayText, isEmptyDisplayValue } from '@/utils/display';
import DictDataFormModal, { type DictDataFormValues } from './DictDataFormModal';

export interface DictDataModalProps {
  open: boolean;
  dictType: DictTypeRecord | null;
  onClose: () => void;
}

/** 字典数据管理弹框（页面局部组件） */
export default function DictDataModal({ open, dictType, onClose }: DictDataModalProps) {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DictDataRecord | null>(null);

  const createMutation = useMutation({ mutationFn: createDictData });
  const updateMutation = useMutation({ mutationFn: updateDictData });
  const deleteMutation = useMutation({ mutationFn: deleteDictData });

  const statusEnum = {
    1: { text: t('dict.enabled'), status: 'Success' },
    0: { text: t('dict.disabled'), status: 'Error' },
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditMode(false);
    setEditingRecord(null);
  };

  const handleClose = () => {
    closeForm();
    onClose();
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setEditingRecord(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (record: DictDataRecord) => {
    setEditMode(true);
    setEditingRecord(record);
    setFormOpen(true);
  };

  const handleSubmit = async (
    values: DictDataFormValues,
    isEdit: boolean,
    record: DictDataRecord | null,
  ): Promise<boolean> => {
    if (!dictType) return false;

    const payload = {
      ...values,
      typeId: dictType.id,
    };

    const res =
      isEdit && record
        ? await updateMutation.mutateAsync({
            id: record.id,
            ...payload,
          } as DictDataUpdateRequest)
        : await createMutation.mutateAsync(payload as DictDataCreateRequest);

    if (res.code !== 0) {
      message.error(res.msg || t('common.error'));
      return false;
    }

    message.success(isEdit ? t('dict.updateSuccess') : t('dict.createSuccess'));
    actionRef.current?.reload();
    return true;
  };

  const columns: ProColumns<DictDataRecord>[] = [
    {
      title: t('dict.dataLabel'),
      dataIndex: 'label',
      width: 160,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('dict.dataValue'),
      dataIndex: 'value',
      width: 140,
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('dict.cssClass'),
      dataIndex: 'cssClass',
      width: 140,
      search: false,
      render: (_, record) =>
        isEmptyDisplayValue(record.cssClass) ? (
          '-'
        ) : (
          <span className={record.cssClass}>{displayText(record.label)}</span>
        ),
    },
    {
      title: t('dict.sort'),
      dataIndex: 'sort',
      width: 80,
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('dict.status'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, record) =>
        record.status === 1 ? (
          <Tag color="green">{t('dict.enabled')}</Tag>
        ) : (
          <Tag color="red">{t('dict.disabled')}</Tag>
        ),
    },
    {
      title: t('dict.defaultFlag'),
      dataIndex: 'defaultFlag',
      width: 90,
      search: false,
      render: (_, record) =>
        record.defaultFlag === 1 ? (
          <Tag color="blue">{t('dict.yes')}</Tag>
        ) : (
          <Tag>{t('dict.no')}</Tag>
        ),
    },
    {
      title: t('dict.createTime'),
      dataIndex: 'createTime',
      width: 180,
      valueType: 'dateTime',
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('dict.action'),
      valueType: 'option',
      key: 'option',
      width: 140,
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
        <Popconfirm
          key="del"
          title={t('dict.deleteConfirm')}
          onConfirm={async () => {
            const res = await deleteMutation.mutateAsync(record.id);
            if (res.code !== 0) {
              message.error(res.msg || t('common.error'));
              return;
            }
            message.success(t('common.success'));
            actionRef.current?.reload();
          }}
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
    <>
      <Modal
        title={t('dict.viewData')}
        open={open}
        onCancel={handleClose}
        footer={null}
        width={1000}
        destroyOnHidden
      >
        {dictType ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md bg-gray-50 px-4 py-3">
              <Typography.Text strong>{dictType.name}</Typography.Text>
              <Typography.Text type="secondary" className="ml-2">
                {dictType.type}
              </Typography.Text>
            </div>

            <ProTable<DictDataRecord>
              actionRef={actionRef}
              rowKey="id"
              columns={columns}
              search={{ labelWidth: 'auto' }}
              options={{ reload: true, density: true, setting: true }}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              scroll={{ x: 900, y: 420 }}
              request={async (params) => {
                const res = await getDictDataPage({
                  current: params.current ?? 1,
                  size: params.pageSize ?? 10,
                  typeId: dictType.id,
                  label: params.label,
                  status: params.status,
                });
                if (res.code !== 0) return { data: [], success: false, total: 0 };
                return { data: res.data.records, success: true, total: res.data.total };
              }}
              toolBarRender={() => [
                <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
                  {t('dict.addData')}
                </Button>,
              ]}
            />
          </div>
        ) : null}
      </Modal>

      <DictDataFormModal
        open={formOpen}
        editMode={editMode}
        record={editingRecord}
        onSubmit={handleSubmit}
        onClose={closeForm}
      />
    </>
  );
}
