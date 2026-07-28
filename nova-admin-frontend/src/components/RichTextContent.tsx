import { useMemo } from 'react';
import { sanitizeRichHtml } from '@/utils/richText';

interface RichTextContentProps {
  content?: string;
  className?: string;
}

export default function RichTextContent({ content, className }: RichTextContentProps) {
  const sanitizedHtml = useMemo(() => sanitizeRichHtml(content), [content]);

  return (
    <div
      className={['notice-rich-content', className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
}
