import { useState, useRef } from 'react';
import { Button, Tag, Popconfirm, message, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProFormRadio,
  type ProColumns,
  type ActionType,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getDictTypePage,
  getDictDataPage,
  createDictType,
  updateDictType,
  deleteDictType,
  createDictData,
  updateDictData,
  deleteDictData,
  type DictTypeRecord,
  type DictDataRecord,
  type DictTypeCreateRequest,
  type DictTypeUpdateRequest,
  type DictDataCreateRequest,
  type DictDataUpdateRequest,
} from '@/api/dict';

export default function DictPage() {
  const { t } = useTranslation();
  const typeActionRef = useRef<ActionType>(null);
  const dataActionRef = useRef<ActionType>(null);

  const [activeTab, setActiveTab] = useState<'type' | 'data'>('type');
  const [selectedDictType, setSelectedDictType] = useState<DictTypeRecord | null>(null);

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeEditMode, setTypeEditMode] = useState(false);
  const [editingType, setEditingType] = useState<DictTypeRecord | null>(null);

  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [dataEditMode, setDataEditMode] = useState(false);
  const [editingData, setEditingData] = useState<DictDataRecord | null>(null);

  const createTypeMutation = useMutation({ mutationFn: createDictType });
  const updateTypeMutation = useMutation({ mutationFn: updateDictType });
  const deleteTypeMutation = useMutation({ mutationFn: deleteDictType });
  const createDataMutation = useMutation({ mutationFn: createDictData });
  const updateDataMutation = useMutation({ mutationFn: updateDictData });
  const deleteDataMutation = useMutation({ mutationFn: deleteDictData });

  const statusEnum = {
    1: { text: t('dict.enabled'), status: 'Success' },
    0: { text: t('dict.disabled'), status: 'Error' },
  };

  const typeColumns: ProColumns<DictTypeRecord>[] = [
    { title: t('dict.typeName'), dataIndex: 'name', width: 160, ellipsis: true },
    { title: t('dict.typeCode'), dataIndex: 'type', width: 160, ellipsis: true },
    {
      title: t('dict.status'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, r) =>
        r.status === 1 ? (
          <Tag color="green">{t('dict.enabled')}</Tag>
        ) : (
          <Tag color="red">{t('dict.disabled')}</Tag>
        ),
    },
    {
      title: t('dict.description'),
      dataIndex: 'description',
      search: false,
      ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: t('dict.createTime'),
      dataIndex: 'createTime',
      width: 180,
      valueType: 'dateTime',
      search: false,
      render: (v) => v || '-',
    },
    {
      title: t('dict.action'),
      valueType: 'option',
      key: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => [
        <Button key="data" type="link" size="small" onClick={() => { setSelectedDictType(record); setActiveTab('data'); }}>
          {t('dict.viewData')}
        </Button>,
        <Button
          key="edit"
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => { setTypeEditMode(true); setEditingType(record); setTypeModalOpen(true); }}
        >
          {t('common.edit')}
        </Button>,
        <Popconfirm
          key="del"
          title={t('dict.deleteConfirm')}
          onConfirm={() => deleteTypeMutation.mutate(record.id)}
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

  const dataColumns: ProColumns<DictDataRecord>[] = [
    { title: t('dict.dataLabel'), dataIndex: 'label', width: 160, ellipsis: true },
    { title: t('dict.dataValue'), dataIndex: 'value', width: 140, search: false },
    {
      title: t('dict.cssClass'),
      dataIndex: 'cssClass',
      width: 140,
      search: false,
      render: (_, r) => (r.cssClass ? <span className={r.cssClass}>{r.label}</span> : r.label),
    },
    { title: t('dict.sort'), dataIndex: 'sort', width: 80, search: false },
    {
      title: t('dict.status'),
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: statusEnum,
      render: (_, r) =>
        r.status === 1 ? (
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
      render: (_, r) =>
        r.defaultFlag === 1 ? (
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
      render: (v) => v || '-',
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
          onClick={() => { setDataEditMode(true); setEditingData(record); setDataModalOpen(true); }}
        >
          {t('common.edit')}
        </Button>,
        <Popconfirm
          key="del"
          title={t('dict.deleteConfirm')}
          onConfirm={() => deleteDataMutation.mutate(record.id)}
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
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">{t('menu.dict')}</h2>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          if (key === 'type') setSelectedDictType(null);
          setActiveTab(key as 'type' | 'data');
        }}
        items={[
          {
            key: 'type',
            label: t('dict.typeTab'),
            children: (
              <>
                <ProTable<DictTypeRecord>
                  actionRef={typeActionRef}
                  rowKey="id"
                  columns={typeColumns}
                  scroll={{ x: 900 }}
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
                    <Button
                      key="add"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => { setTypeEditMode(false); setEditingType(null); setTypeModalOpen(true); }}
                    >
                      {t('dict.addType')}
                    </Button>,
                  ]}
                  options={{ reload: true, density: true, setting: true }}
                />
                <ModalForm
                  title={typeEditMode ? t('dict.editType') : t('dict.addType')}
                  open={typeModalOpen}
                  onOpenChange={(open) => {
                    setTypeModalOpen(open);
                    if (!open) { setTypeEditMode(false); setEditingType(null); }
                  }}
                  width={520}
                  layout="vertical"
                  initialValues={
                    typeEditMode && editingType
                      ? { name: editingType.name, type: editingType.type, status: editingType.status, description: editingType.description }
                      : { status: 1 }
                  }
                  onFinish={async (values) => {
                    const res =
                      typeEditMode && editingType
                        ? await updateTypeMutation.mutateAsync({ id: editingType.id, ...values } as unknown as DictTypeUpdateRequest)
                        : await createTypeMutation.mutateAsync(values as unknown as DictTypeCreateRequest);
                    if (res.code !== 0) { message.error(res.msg || t('common.error')); return false; }
                    message.success(typeEditMode ? t('dict.updateSuccess') : t('dict.createSuccess'));
                    typeActionRef.current?.reload();
                    return true;
                  }}
                >
                  <ProFormText name="name" label={t('dict.typeName')} rules={[{ required: true, message: t('dict.typeNameRequired') }]} />
                  <ProFormText name="type" label={t('dict.typeCode')} disabled={typeEditMode} rules={[{ required: true, message: t('dict.typeCodeRequired') }]} />
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
              </>
            ),
          },
          {
            key: 'data',
            label: t('dict.dataTab'),
            disabled: !selectedDictType,
            children: selectedDictType ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <Button size="small" onClick={() => { setSelectedDictType(null); setActiveTab('type'); }}>
                    {t('common.back')}
                  </Button>
                  <span className="text-gray-500">
                    {selectedDictType.name}（{selectedDictType.type}）
                  </span>
                </div>
                <ProTable<DictDataRecord>
                  actionRef={dataActionRef}
                  rowKey="id"
                  columns={dataColumns}
                  scroll={{ x: 900 }}
                  request={async (params) => {
                    const res = await getDictDataPage({
                      current: params.current ?? 1,
                      size: params.pageSize ?? 10,
                      typeId: selectedDictType.id,
                      label: params.label,
                      status: params.status,
                    });
                    if (res.code !== 0) return { data: [], success: false, total: 0 };
                    return { data: res.data.records, success: true, total: res.data.total };
                  }}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  search={{ labelWidth: 'auto' }}
                  toolBarRender={() => [
                    <Button
                      key="add"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => { setDataEditMode(false); setEditingData(null); setDataModalOpen(true); }}
                    >
                      {t('dict.addData')}
                    </Button>,
                  ]}
                  options={{ reload: true, density: true, setting: true }}
                />
                <ModalForm
                  title={dataEditMode ? t('dict.editData') : t('dict.addData')}
                  open={dataModalOpen}
                  onOpenChange={(open) => {
                    setDataModalOpen(open);
                    if (!open) { setDataEditMode(false); setEditingData(null); }
                  }}
                  width={520}
                  layout="vertical"
                  initialValues={
                    dataEditMode && editingData
                      ? { label: editingData.label, value: editingData.value, cssClass: editingData.cssClass, sort: editingData.sort, status: editingData.status, defaultFlag: editingData.defaultFlag }
                      : { status: 1, defaultFlag: 0, sort: 0 }
                  }
                  onFinish={async (values) => {
                    const payload = { ...values, typeId: selectedDictType.id };
                    const res =
                      dataEditMode && editingData
                        ? await updateDataMutation.mutateAsync({ id: editingData.id, ...payload } as unknown as DictDataUpdateRequest)
                        : await createDataMutation.mutateAsync(payload as unknown as DictDataCreateRequest);
                    if (res.code !== 0) { message.error(res.msg || t('common.error')); return false; }
                    message.success(dataEditMode ? t('dict.updateSuccess') : t('dict.createSuccess'));
                    dataActionRef.current?.reload();
                    return true;
                  }}
                >
                  <ProFormText name="label" label={t('dict.dataLabel')} rules={[{ required: true, message: t('dict.dataLabelRequired') }]} />
                  <ProFormText name="value" label={t('dict.dataValue')} rules={[{ required: true, message: t('dict.dataValueRequired') }]} />
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
                </ModalForm>
              </>
            ) : null,
          },
        ]}
      />
    </div>
  );
}
