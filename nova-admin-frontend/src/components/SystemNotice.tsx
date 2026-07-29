import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActiveNotice, type ActiveNotice } from '@/api/settings';
import AnnouncementDialog from '@/components/AnnouncementDialog';

const DISMISSED_NOTICE_KEY = 'nova-dismissed-notice';

const getNoticeFingerprint = (notice: ActiveNotice) =>
  JSON.stringify([notice.title ?? '', notice.content ?? '']);

const getDismissedNotice = () => {
  try {
    return sessionStorage.getItem(DISMISSED_NOTICE_KEY);
  } catch {
    return null;
  }
};

const dismissNotice = (fingerprint: string) => {
  try {
    sessionStorage.setItem(DISMISSED_NOTICE_KEY, fingerprint);
  } catch {
    // 会话存储不可用时保留默认行为，用户仍可在当前弹窗关闭公告。
  }
};

export default function SystemNotice() {
  const [open, setOpen] = useState(false);
  const [fingerprint, setFingerprint] = useState<string>();
  const { data: notice } = useQuery<ActiveNotice | null>({
    queryKey: ['settings', 'active-notice'],
    queryFn: async () => {
      const res = await getActiveNotice();
      return res.code === 0 ? (res.data ?? null) : null;
    },
    refetchOnMount: 'always',
    staleTime: 0,
  });

  useEffect(() => {
    if (!notice) return;

    const fingerprint = getNoticeFingerprint(notice);
    if (getDismissedNotice() === fingerprint) return;

    setFingerprint(fingerprint);
    setOpen(true);
  }, [notice]);

  return (
    <AnnouncementDialog
      notice={notice ?? undefined}
      onDismiss={() => {
        if (fingerprint) dismissNotice(fingerprint);
        setOpen(false);
      }}
      open={open}
    />
  );
}
