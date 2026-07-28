import { Button, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ActiveNotice } from '@/api/settings';
import RichTextContent from './RichTextContent';

interface AnnouncementDialogProps {
  notice?: ActiveNotice;
  onDismiss: () => void;
  open: boolean;
}

export default function AnnouncementDialog({ notice, onDismiss, open }: AnnouncementDialogProps) {
  const { t } = useTranslation();

  return (
    <Modal
      centered
      footer={null}
      onCancel={onDismiss}
      open={open}
      styles={{ body: { padding: 0 } }}
      title={null}
      width={560}
    >
      <article className="announcement-dialog">
        <header className="announcement-dialog-header">
          <h2>{notice?.title?.trim() || t('notice.defaultTitle')}</h2>
        </header>
        <RichTextContent className="announcement-dialog-content" content={notice?.content} />
        <footer className="announcement-dialog-actions">
          <Button onClick={onDismiss} type="primary">
            {t('notice.dismiss')}
          </Button>
        </footer>
      </article>
    </Modal>
  );
}
