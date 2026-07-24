import { create } from 'zustand';
import { getDictDataByType, type DictDataRecord } from '@/api/dict';

interface DictState {
  cache: Record<string, DictDataRecord[]>;
  loading: Record<string, boolean>;
  fetchDict: (type: string) => Promise<void>;
}

export const useDictStore = create<DictState>((set, get) => ({
  cache: {},
  loading: {},
  fetchDict: async (type) => {
    if (get().cache[type] !== undefined || get().loading[type]) return;
    set((s) => ({ loading: { ...s.loading, [type]: true } }));
    try {
      const res = await getDictDataByType(type);
      const data = (res.data ?? []).filter((item) => item.status === 1);
      set((s) => ({
        cache: { ...s.cache, [type]: data },
        loading: { ...s.loading, [type]: false },
      }));
    } catch {
      set((s) => ({ loading: { ...s.loading, [type]: false } }));
    }
  },
}));
