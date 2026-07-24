import { useEffect } from 'react';
import { useDictStore } from '@/stores/dictStore';
import type { DictDataRecord } from '@/api/dict';

export interface DictOption {
  label: string;
  value: string;
}

export interface DictResult {
  /** 用于 Select / Radio / Checkbox 的 options */
  options: DictOption[];
  /** 根据 value 查标签，找不到时返回原值 */
  getLabel: (value: string | number | null | undefined) => string;
  /** 获取完整字典项（含 cssClass，可用于 Tag 颜色） */
  getDictItem: (value: string | number | null | undefined) => DictDataRecord | undefined;
  loading: boolean;
}

export function useDict(type: string): DictResult {
  const items = useDictStore((s) => s.cache[type] ?? []);
  const loading = useDictStore((s) => s.loading[type] ?? false);
  const fetchDict = useDictStore((s) => s.fetchDict);

  useEffect(() => {
    fetchDict(type);
  }, [type, fetchDict]);

  return {
    options: items.map((item) => ({ label: item.label, value: item.value })),
    getLabel: (value) => {
      if (value === null || value === undefined) return '';
      return items.find((item) => item.value === String(value))?.label ?? String(value);
    },
    getDictItem: (value) => {
      if (value === null || value === undefined) return undefined;
      return items.find((item) => item.value === String(value));
    },
    loading,
  };
}
