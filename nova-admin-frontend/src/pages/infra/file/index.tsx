import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Popconfirm,
  message,
  Image,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getFilePage, uploadFile, deleteFile, type FileRecord } from '@/api/file';

const FILE_PAGE_KEY = ['filePage'];

/** 文件大小格式化 */
function formatFileSize(size?: number): string {
  if (size === undefined || size === null) return '-';
  if (size > 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${(size / 1024).toFixed(2)} KB`;
}

/** 判断是否为图片类型 */
function isImage(contentType?: string): boolean {
  return contentType ? contentType.startsWith('image/') : false;
}

export default function FilePage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchForm] = Form.useForm();

  const [pageParams, setPageParams] = useState<any>({ current: 1, size: 10 });
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  // ========== Queries & Mutations ==========
  const { data, isLoading } = useQuery({
    queryKey: [...FILE_PAGE_KEY, pageParams],
    queryFn: async () => {
      const res = await getFilePage(pageParams);
      return res.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('file.uploadSuccess'));
        queryClient.invalidateQueries({ queryKey: FILE_PAGE_KEY });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('file.deleteSuccess'));
        queryClient.invalidateQueries({ queryKey: FILE_PAGE_KEY });
      }
    },
  });

  // ========== Handlers ==========
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    const params: any = { current: 1, size: pageParams.size };
    if (values.name) params.name = values.name;
    if (values.contentType) params.contentType = values.contentType;
    setPageParams(params);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setPageParams({ current: 1, size: 10 });
  };

  const handlePreview = (record: FileRecord) => {
    setPreviewFile(record);
    setPreviewOpen(true);
  };

  const handleDownload = (record: FileRecord) => {
    const link = document.createElement('a');
    link.href = record.url;
    link.download = record.originalName || record.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    customRequest: (options) => {
      const file = options.file as File;
      uploadMutation.mutate(file);
    },
  };

  const storageTypeMap: Record<string, string> = {
    local: t('file.local'),
    minio: t('file.minio'),
  };

  // ========== Columns ==========
  const columns = [
    {
      title: t('file.fileName'),
      dataIndex: 'originalName',
      key: 'originalName',
      width: 200,
      render: (v: string, record: FileRecord) => v || record.name || '-',
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      width: 260,
      render: (v: string) =>
        v ? (
          <a href={v} target="_blank" rel="noopener noreferrer" className="break-all">
            {v}
          </a>
        ) : (
          '-'
        ),
    },
    {
      title: t('file.fileSize'),
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (v: number) => formatFileSize(v),
    },
    {
      title: t('file.fileType'),
      dataIndex: 'contentType',
      key: 'contentType',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: t('file.storageType'),
      dataIndex: 'storageType',
      key: 'storageType',
      width: 100,
      render: (v: string) => {
        const label = storageTypeMap[v] || v;
        return v ? <Tag color="blue">{label}</Tag> : '-';
      },
    },
    {
      title: t('file.uploadTime'),
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (v: string) => v || '-',
    },
    {
      title: t('common.delete'),
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: unknown, record: FileRecord) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record)}
          >
            {t('file.preview')}
          </Button>
          <Popconfirm
            title={t('file.deleteConfirm')}
            onConfirm={() => deleteMutation.mutate(record.id)}
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

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">{t('menu.file')}</h2>

      {/* Search Bar */}
      <Card className="mb-4" styles={{ body: { padding: '16px' } }}>
        <Form form={searchForm} layout="inline" className="flex flex-wrap gap-2">
          <Form.Item name="name" label={t('file.fileName')}>
            <Input placeholder={t('file.fileName')} allowClear />
          </Form.Item>
          <Form.Item name="contentType" label={t('file.fileType')}>
            <Select
              placeholder={t('file.fileType')}
              allowClear
              style={{ width: 160 }}
              options={[
                { label: 'image/png', value: 'image/png' },
                { label: 'image/jpeg', value: 'image/jpeg' },
                { label: 'image/gif', value: 'image/gif' },
                { label: 'image/webp', value: 'image/webp' },
                { label: 'application/pdf', value: 'application/pdf' },
                { label: 'text/plain', value: 'text/plain' },
                { label: 'application/json', value: 'application/json' },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                {t('common.search')}
              </Button>
              <Button onClick={handleReset}>{t('common.reset')}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Table */}
      <Card className="flex-1">
        <div className="flex justify-between mb-4">
          <Upload {...uploadProps}>
            <Button type="primary" icon={<UploadOutlined />} loading={uploadMutation.isPending}>
              {t('file.upload')}
            </Button>
          </Upload>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => queryClient.invalidateQueries({ queryKey: FILE_PAGE_KEY })}
          >
            {t('common.reset')}
          </Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data?.records ?? []}
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{
            current: data?.current ?? pageParams.current,
            pageSize: data?.size ?? pageParams.size,
            total: data?.total ?? 0,
            showSizeChanger: true,
            onChange: (page: number, pageSize: number) => {
              setPageParams((prev: any) => ({ ...prev, current: page, size: pageSize }));
            },
          }}
        />
      </Card>

      {/* Preview Modal */}
      <Modal
        title={previewFile?.originalName || previewFile?.name || t('file.preview')}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {previewFile && isImage(previewFile.contentType) ? (
          <div className="flex justify-center">
            <Image src={previewFile.url} alt={previewFile.name} style={{ maxHeight: '70vh' }} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-gray-500">{t('file.download')}</p>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => previewFile && handleDownload(previewFile)}
            >
              {t('file.download')}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}