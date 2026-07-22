import { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Tabs,
  message,
  Typography,
} from 'antd';
import { DownloadOutlined, CodeOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { listGenTables, previewGen, downloadGen, type GenTable } from '@/api/gen';

export default function GenPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['genTables'],
    queryFn: async () => (await listGenTables()).data,
  });

  const previewMutation = useMutation({
    mutationFn: previewGen,
    onSuccess: (res) => {
      if (res.code === 0 && res.data) {
        setFiles(res.data);
        setPreviewOpen(true);
      }
    },
  });

  const downloadMutation = useMutation({
    mutationFn: downloadGen,
    onSuccess: (res) => {
      const blob = new Blob([res.data as ArrayBuffer], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
      message.success(t('gen.downloadSuccess'));
    },
  });

  const columns = [
    { title: t('gen.tableName'), dataIndex: 'tableName', key: 'tableName' },
    {
      title: t('gen.tableComment'),
      dataIndex: 'tableComment',
      key: 'tableComment',
      render: (v: string) => v || '-',
    },
    {
      title: t('common.action'),
      key: 'action',
      width: 220,
      render: (_: unknown, record: GenTable) => (
        <Space>
          <Button
            type="link"
            icon={<CodeOutlined />}
            onClick={() => previewMutation.mutate(record.tableName)}
          >
            {t('gen.preview')}
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => downloadMutation.mutate(record.tableName)}
          >
            {t('gen.download')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">{t('menu.gen')}</h2>
      <Card className="flex-1">
        <Table
          rowKey="tableName"
          columns={columns}
          dataSource={data ?? []}
          loading={isLoading}
          pagination={false}
        />
      </Card>

      <Modal
        title={t('gen.preview')}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={900}
        footer={null}
        destroyOnClose
      >
        <Tabs
          items={Object.entries(files).map(([path, content]) => ({
            key: path,
            label: path,
            children: (
              <Typography.Paragraph>
                <pre className="text-xs bg-gray-50 p-3 overflow-auto max-h-[480px]">{content}</pre>
              </Typography.Paragraph>
            ),
          }))}
        />
      </Modal>
    </div>
  );
}
