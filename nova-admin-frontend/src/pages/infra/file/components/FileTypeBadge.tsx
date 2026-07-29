import type { ReactNode } from 'react';
import {
  FileExcelOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  FileWordOutlined,
  FileZipOutlined,
} from '@ant-design/icons';
import { Tag, Tooltip } from 'antd';

interface FileTypeBadgeProps {
  contentType?: string;
  fileName?: string;
}

interface FileTypePresentation {
  color: string;
  icon: ReactNode;
  label: string;
}

const FILE_TYPE_PRESENTATIONS: Record<string, FileTypePresentation> = {
  pdf: { label: 'PDF', color: 'red', icon: <FilePdfOutlined /> },
  image: { label: 'IMAGE', color: 'cyan', icon: <FileImageOutlined /> },
  word: { label: 'DOC', color: 'blue', icon: <FileWordOutlined /> },
  excel: { label: 'XLS', color: 'green', icon: <FileExcelOutlined /> },
  powerpoint: { label: 'PPT', color: 'volcano', icon: <FilePptOutlined /> },
  text: { label: 'TEXT', color: 'gold', icon: <FileTextOutlined /> },
  archive: { label: 'ARCHIVE', color: 'purple', icon: <FileZipOutlined /> },
  unknown: { label: 'FILE', color: 'default', icon: <FileUnknownOutlined /> },
};

const getExtension = (fileName?: string) => {
  if (!fileName) return '';
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex < 0 ? '' : fileName.slice(dotIndex + 1).toUpperCase();
};

const getPresentation = (contentType?: string): FileTypePresentation => {
  const normalizedType = contentType?.toLowerCase() ?? '';
  if (normalizedType.startsWith('image/')) return FILE_TYPE_PRESENTATIONS.image;
  if (normalizedType === 'application/pdf') return FILE_TYPE_PRESENTATIONS.pdf;
  if (normalizedType.includes('wordprocessingml') || normalizedType === 'application/msword') {
    return FILE_TYPE_PRESENTATIONS.word;
  }
  if (normalizedType.includes('spreadsheetml') || normalizedType === 'application/vnd.ms-excel') {
    return FILE_TYPE_PRESENTATIONS.excel;
  }
  if (
    normalizedType.includes('presentationml') ||
    normalizedType === 'application/vnd.ms-powerpoint'
  ) {
    return FILE_TYPE_PRESENTATIONS.powerpoint;
  }
  if (normalizedType.startsWith('text/') || normalizedType === 'application/json') {
    return FILE_TYPE_PRESENTATIONS.text;
  }
  if (
    normalizedType.includes('zip') ||
    normalizedType.includes('rar') ||
    normalizedType.includes('7z')
  ) {
    return FILE_TYPE_PRESENTATIONS.archive;
  }
  return FILE_TYPE_PRESENTATIONS.unknown;
};

export const isImageFile = (contentType?: string) => contentType?.startsWith('image/') ?? false;

export const isPdfFile = (contentType?: string) => contentType === 'application/pdf';

export const isPreviewableFile = (contentType?: string) =>
  isImageFile(contentType) || isPdfFile(contentType);

export default function FileTypeBadge({ contentType, fileName }: FileTypeBadgeProps) {
  const presentation = getPresentation(contentType);
  const extension = getExtension(fileName);
  const label =
    presentation === FILE_TYPE_PRESENTATIONS.unknown && extension ? extension : presentation.label;

  return (
    <Tooltip title={contentType || extension || '-'}>
      <Tag color={presentation.color} icon={presentation.icon}>
        {label}
      </Tag>
    </Tooltip>
  );
}
