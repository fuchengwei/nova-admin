import { useRef, useState } from 'react';
import { Button, Modal, Tabs, message, Typography } from 'antd';
import { DownloadOutlined, CodeOutlined } from '@ant-design/icons';
import {
  ProTable,
  type ProColumns,
  type ActionType,
} from '@ant-design/pro-components';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { listGenTables, previewGen, downloadGen, type GenTable } from '@/api/gen';
import { useTableScrollY } from '@/hooks/useTableScrollY';

export default function GenPage() {
  const { t } = useTranslation();
  const actionRef = useRef<ActionType>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>({});

  const previewMutation = useMutation({
    mutationFn: previewGen,
    onSuccess: (res) => {
      if (res.code === 0 && res.data) {
        setFiles(res.data);
        setPreviewOpen(true);
      } else {
        message.error(res.msg || t('common.error'));
      }
    },
  });

  const downloadMutation = useMutation({
    mutationFn: downloadGen,
    onSuccess: (res) => {
      // downloadGen 返回经拦截器解包的 Blob
      const blob = new Blob([res as Blob], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
      message.success(t('gen.downloadSuccess'));
    },
  });

  const columns: ProColumns<GenTable>[] = [
    { title: t('gen.tableName'), dataIndex: 'tableName', ellipsis: true },
    {
      title: t('gen.tableComment'),
      dataIndex: 'tableComment',
      render: (v) => (v as string) || '-',
    },
    {
      title: t('common.action'),
      valueType: 'option',
      key: 'option',
      width: 220,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="preview"
          type="link"
          icon={<CodeOutlined />}
          onClick={() => previewMutation.mutate(record.tableName)}
        >
          {t('gen.preview')}
        </Button>,
        <Button
          key="download"
          type="link"
          icon={<DownloadOutlined />}
          onClick={() => downloadMutation.mutate(record.tableName)}
        >
          {t('gen.download')}
        </Button>,
      ],
    },
  ];

  const { wrapperRef, scrollY } = useTableScrollY();

  return (
    <div className="flex min-h-0 h-full flex-col">
      <h2 className="text-lg font-semibold mb-4">{t('menu.gen')}</h2>

      <div ref={wrapperRef} className="min-h-0 flex-1">
        <ProTable<GenTable>
          actionRef={actionRef}
          rowKey="tableName"
          columns={columns}
          style={{ height: '100%' }}
          scroll={{ x: 800, y: scrollY }}
          search={false}
          pagination={false}
          options={{ reload: true }}
          request={async () => {
            const res = await listGenTables();
            if (res.code !== 0) return { data: [], success: false, total: 0 };
            return { data: res.data, success: true, total: res.data.length };
          }}
        />
      </div>

      <Modal
        title={t('gen.preview')}
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        width={900}
        footer={null}
        destroyOnHidden
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
