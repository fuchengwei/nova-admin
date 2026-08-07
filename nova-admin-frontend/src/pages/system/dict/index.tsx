import { useRef, useState } from 'react';
import { Button, Popconfirm, Tag, Typography } from 'antd';
import { message } from '@/utils/message';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormRadio,
  ProFormText,
  ProFormTextArea,
  ProTable,
  type ActionType,
  type ProColumns,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  createDictType,
  deleteDictType,
  getDictTypePage,
  updateDictType,
  type DictTypeCreateRequest,
  type DictTypeRecord,
  type DictTypeUpdateRequest,
} from '@/api/dict';
import { useTableScrollY } from '@/hooks/useTableScrollY';
import { displayText } from '@/utils/display';
import layoutStyles from '@/styles/layout.module.css';
import DictDataModal from './components/DictDataModal';

export default function DictPage() {
  const { t } = useTranslation();
  const typeActionRef = useRef<ActionType>(null);

  const [selectedDictType, setSelectedDictType] = useState<DictTypeRecord | null>(null);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeEditMode, setTypeEditMode] = useState(false);
  const [editingType, setEditingType] = useState<DictTypeRecord | null>(null);

  const createTypeMutation = useMutation({ mutationFn: createDictType });
  const updateTypeMutation = useMutation({ mutationFn: updateDictType });
  const deleteTypeMutation = useMutation({ mutationFn: deleteDictType });

  const statusEnum = {
    1: { text: t('dict.enabled'), status: 'Success' },
    0: { text: t('dict.disabled'), status: 'Error' },
  };

  const handleOpenAdd = () => {
    setTypeEditMode(false);
    setEditingType(null);
    setTypeModalOpen(true);
  };

  const handleOpenEdit = (record: DictTypeRecord) => {
    setTypeEditMode(true);
    setEditingType(record);
    setTypeModalOpen(true);
  };

  const handleCloseTypeModal = () => {
    setTypeModalOpen(false);
    setTypeEditMode(false);
    setEditingType(null);
  };

  const handleOpenDataModal = (record: DictTypeRecord) => {
    setSelectedDictType(record);
    setDataModalOpen(true);
  };

  const handleCloseDataModal = () => {
    setDataModalOpen(false);
    setSelectedDictType(null);
  };

  const columns: ProColumns<DictTypeRecord>[] = [
    {
      title: t('dict.typeName'),
      dataIndex: 'name',
      width: 160,
      ellipsis: true,
      render: (value) => displayText(value),
    },
    {
      title: t('dict.typeCode'),
      dataIndex: 'type',
      width: 180,
      ellipsis: true,
      render: (_, record) => (
        <Button
          type="link"
          className="px-0! font-medium"
          onClick={() => handleOpenDataModal(record)}
        >
          {displayText(record.type)}
        </Button>
      ),
    },
    {
      title: t('dict.description'),
      dataIndex: 'description',
      search: false,
      ellipsis: true,
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
      width: 160,
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
            const res = await deleteTypeMutation.mutateAsync(record.id);
            if (res.code !== 0) {
              message.error(res.msg || t('common.error'));
              return;
            }
            message.success(t('common.success'));
            typeActionRef.current?.reload();
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

  const { wrapperRef, scrollY } = useTableScrollY();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex items-center gap-2">
        <Typography.Title level={4} className="!mb-0">
          {t('menu.dict')}
        </Typography.Title>
      </div>

      <div ref={wrapperRef} className="min-h-0 flex-1">
        <div className={`${layoutStyles.tableFill} h-full`}>
          <ProTable<DictTypeRecord>
            actionRef={typeActionRef}
            rowKey="id"
            columns={columns}
            style={{ height: '100%' }}
            scroll={{ x: 900, y: scrollY }}
            request={async (params) => {
              const res = await getDictTypePage({
                current: params.current ?? 1,
                size: params.pageSize ?? 10,
                name: params.name,
                type: params.type,
                status: params.status,
              });
              if (res.code !== 0) return { data: [], success: false, total: 0 };
              return { data: res.data.records, success: true, total: res.data.total };
            }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            search={{ labelWidth: 'auto' }}
            toolBarRender={() => [
              <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleOpenAdd}>
                {t('dict.addType')}
              </Button>,
            ]}
            options={{ reload: true, density: true, setting: true }}
          />
        </div>
      </div>

      <ModalForm
        title={typeEditMode ? t('dict.editType') : t('dict.addType')}
        open={typeModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseTypeModal();
        }}
        modalProps={{ destroyOnHidden: true }}
        width={520}
        layout="vertical"
        initialValues={
          typeEditMode && editingType
            ? {
                name: editingType.name,
                type: editingType.type,
                status: editingType.status,
                description: editingType.description,
              }
            : { status: 1 }
        }
        onFinish={async (values) => {
          const res =
            typeEditMode && editingType
              ? await updateTypeMutation.mutateAsync({
                  id: editingType.id,
                  ...values,
                } as unknown as DictTypeUpdateRequest)
              : await createTypeMutation.mutateAsync(values as unknown as DictTypeCreateRequest);
          if (res.code !== 0) {
            message.error(res.msg || t('common.error'));
            return false;
          }
          message.success(typeEditMode ? t('dict.updateSuccess') : t('dict.createSuccess'));
          typeActionRef.current?.reload();
          return true;
        }}
      >
        <ProFormText
          name="name"
          label={t('dict.typeName')}
          rules={[{ required: true, message: t('dict.typeNameRequired') }]}
        />
        <ProFormText
          name="type"
          label={t('dict.typeCode')}
          disabled={typeEditMode}
          rules={[{ required: true, message: t('dict.typeCodeRequired') }]}
        />
        <ProFormTextArea name="description" label={t('dict.description')} />
        <ProFormRadio.Group
          name="status"
          label={t('dict.status')}
          rules={[{ required: true }]}
          options={[
            { label: t('dict.enabled'), value: 1 },
            { label: t('dict.disabled'), value: 0 },
          ]}
        />
      </ModalForm>

      <DictDataModal
        open={dataModalOpen}
        dictType={selectedDictType}
        onClose={handleCloseDataModal}
      />
    </div>
  );
}
