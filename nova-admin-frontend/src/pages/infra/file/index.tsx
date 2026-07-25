import { useRef, useState } from 'react';
import { Button, Tag, Modal, Popconfirm, message, Image, Upload, type UploadProps } from 'antd';
import { DeleteOutlined, ReloadOutlined, EyeOutlined, UploadOutlined } from '@ant-design/icons';
import { ProTable, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { getFilePage, uploadFile, deleteFile, type FileRecord } from '@/api/file';
import { useTableScrollY } from '@/hooks/useTableScrollY';
import { displayText, isEmptyDisplayValue } from '@/utils/display';

function formatFileSize(size?: number): string {
  if (isEmptyDisplayValue(size)) return '-';
  if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / 1024).toFixed(2)} KB`;
}

function isImage(contentType?: string): boolean {
  return contentType ? contentType.startsWith('image/') : false;
}

const contentTypeEnum = {
  'image/png': { text: 'image/png' },
  'image/jpeg': { text: 'image/jpeg' },
  'image/gif': { text: 'image/gif' },
  'image/webp': { text: 'image/webp' },
  'application/pdf': { text: 'application/pdf' },
  'text/plain': { text: 'text/plain' },
  'application/json': { text: 'application/json' },
};

export default function FilePage() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('file.uploadSuccess'));
        actionRef.current?.reload();
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: (res) => {
      if (res.code === 0) {
        message.success(t('file.deleteSuccess'));
        actionRef.current?.reload();
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

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
      uploadMutation.mutate(options.file as File);
    },
  };

  const storageTypeMap: Record<string, string> = {
    local: t('file.local'),
    minio: t('file.minio'),
  };

  const columns: ProColumns<FileRecord>[] = [
    {
      title: t('file.fileName'),
      dataIndex: 'originalName',
      width: 200,
      ellipsis: true,
      render: (value, record) => displayText(displayText(value, record.name), '-'),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      width: 260,
      ellipsis: true,
      render: (value) =>
        isEmptyDisplayValue(value) ? (
          '-'
        ) : (
          <a href={value as string} target="_blank" rel="noopener noreferrer" className="break-all">
            {value}
          </a>
        ),
    },
    {
      title: t('file.fileSize'),
      dataIndex: 'size',
      width: 100,
      search: false,
      render: (v) => formatFileSize(v as number),
    },
    {
      title: t('file.fileType'),
      dataIndex: 'contentType',
      width: 140,
      valueType: 'select',
      valueEnum: contentTypeEnum,
      render: (value) => displayText(value),
    },
    {
      title: t('file.storageType'),
      dataIndex: 'storageType',
      width: 100,
      search: false,
      render: (_, r) => {
        const label = storageTypeMap[r.storageType ?? ''] || r.storageType;
        return isEmptyDisplayValue(r.storageType) ? '-' : <Tag color="blue">{label}</Tag>;
      },
    },
    {
      title: t('file.uploadTime'),
      dataIndex: 'createTime',
      width: 180,
      search: false,
      render: (value) => displayText(value),
    },
    {
      title: t('common.delete'),
      valueType: 'option',
      key: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="preview"
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handlePreview(record)}
        >
          {t('file.preview')}
        </Button>,
        <Popconfirm
          key="del"
          title={t('file.deleteConfirm')}
          onConfirm={() => deleteMutation.mutate(record.id)}
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
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-lg font-semibold">{t('menu.file')}</h2>
        <Upload {...uploadProps}>
          <Button type="primary" icon={<UploadOutlined />} loading={uploadMutation.isPending}>
            {t('file.upload')}
          </Button>
        </Upload>
      </div>

      <div ref={wrapperRef} className="min-h-0 flex-1">
        <ProTable<FileRecord>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          style={{ height: '100%' }}
          scroll={{ x: 1100, y: scrollY }}
          request={async (params) => {
            const res = await getFilePage({
              current: params.current ?? 1,
              size: params.pageSize ?? 10,
              name: params.name,
              contentType: params.contentType,
            });
            if (res.code !== 0) return { data: [], success: false, total: 0 };
            return { data: res.data.records, success: true, total: res.data.total };
          }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          search={{ labelWidth: 'auto' }}
          options={{ reload: true, density: true, setting: true }}
        />
      </div>

      <Modal
        title={previewFile?.originalName || previewFile?.name || t('file.preview')}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={800}
        destroyOnHidden
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
              icon={<ReloadOutlined />}
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
