import { useMemo } from 'react';

import { sanitizeRichHtml } from '@/utils/richText';

import styles from './RichTextContent.module.css';

interface RichTextContentProps {
  content?: string;
  className?: string;
}

export default function RichTextContent({ content, className }: RichTextContentProps) {
  const sanitizedHtml = useMemo(() => sanitizeRichHtml(content), [content]);

  return (
    <div
      className={['text-sm leading-[1.8] text-slate-600', styles.content, className]
        .filter(Boolean)
        .join(' ')}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
