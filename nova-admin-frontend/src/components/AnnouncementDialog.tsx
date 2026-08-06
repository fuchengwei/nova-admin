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
      <article className="px-[30px] pt-7 pb-[22px]">
        <header className="pr-[34px]">
          <h2 className="m-0 text-[22px] leading-[1.4] font-semibold text-slate-900">
            {notice?.title?.trim() || t('notice.defaultTitle')}
          </h2>
        </header>
        <RichTextContent className="mt-[22px] text-slate-600" content={notice?.content} />
        <footer className="mt-[26px] flex justify-end">
          <Button className="min-w-[88px]" onClick={onDismiss} type="primary">
            {t('notice.dismiss')}
          </Button>
        </footer>
      </article>
    </Modal>
  );
}
