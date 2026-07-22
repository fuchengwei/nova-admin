import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tabs,
  Modal,
  Form,
  Input,
  Radio,
  InputNumber,
  Popconfirm,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const DICT_TYPE_KEY = ['dictTypePage'];
const DICT_DATA_KEY = ['dictDataPage'];

export default function DictPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [typeForm] = Form.useForm();
  const [dataForm] = Form.useForm();
  const [typeSearchForm] = Form.useForm();
  const [dataSearchForm] = Form.useForm();

  // Tab state
  const [activeTab, setActiveTab] = useState<'type' | 'data'>('type');
  const [selectedDictType, setSelectedDictType] = useState<DictTypeRecord | null>(null);

  // Dict type state
  const [typePageParams, setTypePageParams] = useState<any>({ current: 1, size: 10 });
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [typeEditMode, setTypeEditMode] = useState(false);
  const [editingType, setEditingType] = useState<DictTypeRecord | null>(null);

  // Dict data state
  const [dataPageParams, setDataPageParams] = useState<any>({ current: 1, size: 10 });
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [dataEditMode, setDataEditMode] = useState(false);
  const [editingData, setEditingData] = useState<DictDataRecord | null>(null);

  // ========== Dict Type Queries & Mutations ==========
  const { data: typeData, isLoading: typeLoading } = useQuery({
    queryKey: [...DICT_TYPE_KEY, typePageParams],
    queryFn: async () => {
      const res = await getDictTypePage(typePageParams);
      return res.data;
    },
  });

  const createTypeMutation = useMutation({
    mutationFn: createDictType,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('dict.createSuccess'));
        queryClient.invalidateQueries({ queryKey: DICT_TYPE_KEY });
        handleCloseTypeModal();
      }
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: updateDictType,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('dict.updateSuccess'));
        queryClient.invalidateQueries({ queryKey: DICT_TYPE_KEY });
        handleCloseTypeModal();
      }
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: deleteDictType,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('dict.deleteSuccess'));
        queryClient.invalidateQueries({ queryKey: DICT_TYPE_KEY });
      }
    },
  });

  // ========== Dict Data Queries & Mutations ==========
  const { data: dataData, isLoading: dataLoading } = useQuery({
    queryKey: [...DICT_DATA_KEY, dataPageParams],
    queryFn: async () => {
      const res = await getDictDataPage(dataPageParams);
      return res.data;
    },
    enabled: activeTab === 'data' && !!selectedDictType,
  });

  const createDataMutation = useMutation({
    mutationFn: createDictData,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('dict.createSuccess'));
        queryClient.invalidateQueries({ queryKey: DICT_DATA_KEY });
        handleCloseDataModal();
      }
    },
  });

  const updateDataMutation = useMutation({
    mutationFn: updateDictData,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('dict.updateSuccess'));
        queryClient.invalidateQueries({ queryKey: DICT_DATA_KEY });
        handleCloseDataModal();
      }
    },
  });

  const deleteDataMutation = useMutation({
    mutationFn: deleteDictData,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('dict.deleteSuccess'));
        queryClient.invalidateQueries({ queryKey: DICT_DATA_KEY });
      }
    },
  });

  // ========== Dict Type Handlers ==========
  const handleOpenAddType = () => {
    setTypeEditMode(false);
    setEditingType(null);
    typeForm.resetFields();
    typeForm.setFieldsValue({ status: 1 });
    setTypeModalOpen(true);
  };

  const handleOpenEditType = (record: DictTypeRecord) => {
    setTypeEditMode(true);
    setEditingType(record);
    typeForm.resetFields();
    typeForm.setFieldsValue({
      type: record.type,
      name: record.name,
      description: record.description,
      status: record.status,
    });
    setTypeModalOpen(true);
  };

  const handleCloseTypeModal = () => {
    setTypeModalOpen(false);
    typeForm.resetFields();
    setEditingType(null);
  };

  const handleTypeSubmit = async () => {
    try {
      const values = await typeForm.validateFields();
      if (typeEditMode && editingType) {
        const data: DictTypeUpdateRequest = { id: editingType.id, ...values };
        updateTypeMutation.mutate(data);
      } else {
        const data: DictTypeCreateRequest = { ...values };
        createTypeMutation.mutate(data);
      }
    } catch {
      // validation failed
    }
  };

  const handleTypeSearch = () => {
    const values = typeSearchForm.getFieldsValue();
    const params: any = { current: 1, size: typePageParams.size };
    if (values.name) params.name = values.name;
    if (values.type) params.type = values.type;
    if (values.status !== undefined && values.status !== null && values.status !== '')
      params.status = values.status;
    setTypePageParams(params);
  };

  const handleTypeReset = () => {
    typeSearchForm.resetFields();
    setTypePageParams({ current: 1, size: 10 });
  };

  const handleViewData = (record: DictTypeRecord) => {
    setSelectedDictType(record);
    setActiveTab('data');
    setDataPageParams({ current: 1, size: 10, typeId: record.id });
  };

  // ========== Dict Data Handlers ==========
  const handleBackToType = () => {
    setActiveTab('type');
    setSelectedDictType(null);
  };

  const handleOpenAddData = () => {
    setDataEditMode(false);
    setEditingData(null);
    dataForm.resetFields();
    dataForm.setFieldsValue({ status: 1, sort: 0, defaultFlag: 0 });
    setDataModalOpen(true);
  };

  const handleOpenEditData = (record: DictDataRecord) => {
    setDataEditMode(true);
    setEditingData(record);
    dataForm.resetFields();
    dataForm.setFieldsValue({
      label: record.label,
      value: record.value,
      cssClass: record.cssClass,
      sort: record.sort,
      status: record.status,
      defaultFlag: record.defaultFlag,
    });
    setDataModalOpen(true);
  };

  const handleCloseDataModal = () => {
    setDataModalOpen(false);
    dataForm.resetFields();
    setEditingData(null);
  };

  const handleDataSubmit = async () => {
    try {
      const values = await dataForm.validateFields();
      if (dataEditMode && editingData) {
        const data: DictDataUpdateRequest = { id: editingData.id, typeId: selectedDictType!.id, ...values };
        updateDataMutation.mutate(data);
      } else {
        const data: DictDataCreateRequest = { typeId: selectedDictType!.id, ...values };
        createDataMutation.mutate(data);
      }
    } catch {
      // validation failed
    }
  };

  const handleDataSearch = () => {
    const values = dataSearchForm.getFieldsValue();
    const params: any = { current: 1, size: dataPageParams.size, typeId: selectedDictType?.id };
    if (values.label) params.label = values.label;
    if (values.status !== undefined && values.status !== null && values.status !== '')
      params.status = values.status;
    setDataPageParams(params);
  };

  const handleDataReset = () => {
    dataSearchForm.resetFields();
    setDataPageParams({ current: 1, size: 10, typeId: selectedDictType?.id });
  };

  // ========== Columns ==========
  const typeColumns = [
    {
      title: t('dict.typeName'),
      dataIndex: 'name',
      key: 'name',
      width: 160,
    },
    {
      title: t('dict.typeCode'),
      dataIndex: 'type',
      key: 'type',
      width: 160,
    },
    {
      title: t('dict.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) =>
        v === 1 ? (
          <Tag color="green">{t('dict.enabled')}</Tag>
        ) : (
          <Tag color="red">{t('dict.disabled')}</Tag>
        ),
    },
    {
      title: t('dict.description'),
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (v: string) => v || '-',
    },
    {
      title: t('dict.createTime'),
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (v: string) => v || '-',
    },
    {
      title: t('dict.action'),
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: unknown, record: DictTypeRecord) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleViewData(record)}>
            {t('dict.viewData')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditType(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('dict.deleteConfirm')}
            onConfirm={() => deleteTypeMutation.mutate(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const dataColumns = [
    {
      title: t('dict.dataLabel'),
      dataIndex: 'label',
      key: 'label',
      width: 140,
    },
    {
      title: t('dict.dataValue'),
      dataIndex: 'value',
      key: 'value',
      width: 140,
    },
    {
      title: t('dict.cssClass'),
      dataIndex: 'cssClass',
      key: 'cssClass',
      width: 120,
      render: (v: string) => v || '-',
    },
    {
      title: t('dict.sort'),
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: t('dict.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: number) =>
        v === 1 ? (
          <Tag color="green">{t('dict.enabled')}</Tag>
        ) : (
          <Tag color="red">{t('dict.disabled')}</Tag>
        ),
    },
    {
      title: t('dict.defaultFlag'),
      dataIndex: 'defaultFlag',
      key: 'defaultFlag',
      width: 100,
      render: (v: number) =>
        v === 1 ? (
          <Tag color="blue">{t('dict.yes')}</Tag>
        ) : (
          <Tag color="default">{t('dict.no')}</Tag>
        ),
    },
    {
      title: t('dict.action'),
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: unknown, record: DictDataRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEditData(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('dict.deleteConfirm')}
            onConfirm={() => deleteDataMutation.mutate(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
            okButtonProps={{ danger: true }}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const typeSubmitting = createTypeMutation.isPending || updateTypeMutation.isPending;
  const dataSubmitting = createDataMutation.isPending || updateDataMutation.isPending;

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">{t('menu.dict')}</h2>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          if (key === 'type') handleBackToType();
        }}
        items={[
          {
            key: 'type',
            label: t('dict.typeTab'),
            children: (
              <>
                {/* Dict Type Search */}
                <Card className="mb-4" styles={{ body: { padding: '16px' } }}>
                  <Form form={typeSearchForm} layout="inline" className="flex flex-wrap gap-2">
                    <Form.Item name="name" label={t('dict.typeName')}>
                      <Input placeholder={t('dict.typeName')} allowClear />
                    </Form.Item>
                    <Form.Item name="type" label={t('dict.typeCode')}>
                      <Input placeholder={t('dict.typeCode')} allowClear />
                    </Form.Item>
                    <Form.Item name="status" label={t('dict.status')}>
                      <Radio.Group>
                        <Radio value={1}>{t('dict.enabled')}</Radio>
                        <Radio value={0}>{t('dict.disabled')}</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleTypeSearch}>
                          {t('common.search')}
                        </Button>
                        <Button onClick={handleTypeReset}>{t('common.reset')}</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>

                {/* Dict Type Table */}
                <Card className="flex-1">
                  <div className="flex justify-between mb-4">
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddType}>
                      {t('dict.addType')}
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => queryClient.invalidateQueries({ queryKey: DICT_TYPE_KEY })}
                    >
                      {t('common.reset')}
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    columns={typeColumns}
                    dataSource={typeData?.records ?? []}
                    loading={typeLoading}
                    scroll={{ x: 1000 }}
                    pagination={{
                      current: typeData?.current ?? typePageParams.current,
                      pageSize: typeData?.size ?? typePageParams.size,
                      total: typeData?.total ?? 0,
                      showSizeChanger: true,
                      onChange: (page: number, pageSize: number) => {
                        setTypePageParams((prev: any) => ({ ...prev, current: page, size: pageSize }));
                      },
                    }}
                  />
                </Card>
              </>
            ),
          },
          {
            key: 'data',
            label: t('dict.dataTab'),
            disabled: !selectedDictType,
            children: selectedDictType ? (
              <>
                {/* Data Tab Header */}
                <div className="mb-4 flex items-center gap-3">
                  <Button icon={<ArrowLeftOutlined />} onClick={handleBackToType}>
                    {t('common.back')}
                  </Button>
                  <span className="text-base font-medium">
                    {selectedDictType.name}（{selectedDictType.type}）
                  </span>
                </div>

                {/* Dict Data Search */}
                <Card className="mb-4" styles={{ body: { padding: '16px' } }}>
                  <Form form={dataSearchForm} layout="inline" className="flex flex-wrap gap-2">
                    <Form.Item name="label" label={t('dict.dataLabel')}>
                      <Input placeholder={t('dict.dataLabel')} allowClear />
                    </Form.Item>
                    <Form.Item name="status" label={t('dict.status')}>
                      <Radio.Group>
                        <Radio value={1}>{t('dict.enabled')}</Radio>
                        <Radio value={0}>{t('dict.disabled')}</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button type="primary" icon={<SearchOutlined />} onClick={handleDataSearch}>
                          {t('common.search')}
                        </Button>
                        <Button onClick={handleDataReset}>{t('common.reset')}</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Card>

                {/* Dict Data Table */}
                <Card className="flex-1">
                  <div className="flex justify-between mb-4">
                    <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenAddData}>
                      {t('dict.addData')}
                    </Button>
                    <Button
                      icon={<ReloadOutlined />}
                      onClick={() => queryClient.invalidateQueries({ queryKey: DICT_DATA_KEY })}
                    >
                      {t('common.reset')}
                    </Button>
                  </div>
                  <Table
                    rowKey="id"
                    columns={dataColumns}
                    dataSource={dataData?.records ?? []}
                    loading={dataLoading}
                    scroll={{ x: 900 }}
                    pagination={{
                      current: dataData?.current ?? dataPageParams.current,
                      pageSize: dataData?.size ?? dataPageParams.size,
                      total: dataData?.total ?? 0,
                      showSizeChanger: true,
                      onChange: (page: number, pageSize: number) => {
                        setDataPageParams((prev: any) => ({ ...prev, current: page, size: pageSize }));
                      },
                    }}
                  />
                </Card>
              </>
            ) : null,
          },
        ]}
      />

      {/* Dict Type Modal */}
      <Modal
        title={typeEditMode ? t('dict.editType') : t('dict.addType')}
        open={typeModalOpen}
        onOk={handleTypeSubmit}
        onCancel={handleCloseTypeModal}
        confirmLoading={typeSubmitting}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnClose
        width={520}
      >
        <Form form={typeForm} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label={t('dict.typeName')}
            rules={[{ required: true, message: t('dict.typeNameRequired') }]}
          >
            <Input placeholder={t('dict.typeName')} />
          </Form.Item>
          <Form.Item
            name="type"
            label={t('dict.typeCode')}
            rules={[{ required: true, message: t('dict.typeCodeRequired') }]}
          >
            <Input placeholder={t('dict.typeCode')} disabled={typeEditMode} />
          </Form.Item>
          <Form.Item name="description" label={t('dict.description')}>
            <Input.TextArea rows={2} placeholder={t('dict.description')} />
          </Form.Item>
          <Form.Item name="status" label={t('dict.status')} rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={1}>{t('dict.enabled')}</Radio>
              <Radio value={0}>{t('dict.disabled')}</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      {/* Dict Data Modal */}
      <Modal
        title={dataEditMode ? t('dict.editData') : t('dict.addData')}
        open={dataModalOpen}
        onOk={handleDataSubmit}
        onCancel={handleCloseDataModal}
        confirmLoading={dataSubmitting}
        okText={t('common.confirm')}
        cancelText={t('common.cancel')}
        destroyOnClose
        width={520}
      >
        <Form form={dataForm} layout="vertical" className="mt-4">
          <Form.Item
            name="label"
            label={t('dict.dataLabel')}
            rules={[{ required: true, message: t('dict.dataLabelRequired') }]}
          >
            <Input placeholder={t('dict.dataLabel')} />
          </Form.Item>
          <Form.Item
            name="value"
            label={t('dict.dataValue')}
            rules={[{ required: true, message: t('dict.dataValueRequired') }]}
          >
            <Input placeholder={t('dict.dataValue')} />
          </Form.Item>
          <Form.Item name="cssClass" label={t('dict.cssClass')}>
            <Input placeholder={t('dict.cssClass')} />
          </Form.Item>
          <Form.Item name="sort" label={t('dict.sort')}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item name="status" label={t('dict.status')} rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={1}>{t('dict.enabled')}</Radio>
              <Radio value={0}>{t('dict.disabled')}</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="defaultFlag" label={t('dict.defaultFlag')}>
            <Radio.Group>
              <Radio value={1}>{t('dict.yes')}</Radio>
              <Radio value={0}>{t('dict.no')}</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
