import { isEmptyDisplayValue } from '@/utils/display';

export const contentTypeEnum = {
  'image/png': { text: 'PNG' },
  'image/jpeg': { text: 'JPEG' },
  'image/gif': { text: 'GIF' },
  'image/webp': { text: 'WEBP' },
  'application/pdf': { text: 'PDF' },
  'text/plain': { text: 'Text' },
  'application/json': { text: 'JSON' },
  'application/msword': { text: 'DOC' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    text: 'DOCX',
  },
  'application/vnd.ms-excel': { text: 'XLS' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    text: 'XLSX',
  },
  'application/vnd.ms-powerpoint': { text: 'PPT' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': {
    text: 'PPTX',
  },
  'application/zip': { text: 'ZIP' },
  'application/x-zip-compressed': { text: 'ZIP' },
  'application/x-rar-compressed': { text: 'RAR' },
  'application/x-7z-compressed': { text: '7Z' },
};

export const formatFileSize = (size?: number): string => {
  if (isEmptyDisplayValue(size)) return '-';
  if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  return `${(size / 1024).toFixed(2)} KB`;
};
