import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'zh_CN' | 'en_US';

interface AppState {
  locale: Locale;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: 'zh_CN',
      theme: 'light',
      sidebarCollapsed: false,
      setLocale: (locale) => set({ locale }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'nova-app' },
  ),
);
