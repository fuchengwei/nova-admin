import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'zh_CN' | 'en_US';
export type ThemePreference = 'system' | 'light' | 'dark';
export type Theme = 'light' | 'dark';

const getSystemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

interface AppState {
  locale: Locale;
  localePreferenceSet: boolean;
  themePreference: ThemePreference;
  theme: Theme;
  sidebarCollapsed: boolean;
  setLocale: (locale: Locale) => void;
  setSystemLocale: (locale: Locale) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setResolvedTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      locale: 'zh_CN',
      localePreferenceSet: false,
      themePreference: 'system',
      theme: getSystemTheme(),
      sidebarCollapsed: false,
      setLocale: (locale) => set({ locale, localePreferenceSet: true }),
      setSystemLocale: (locale) => set({ locale, localePreferenceSet: false }),
      setThemePreference: (themePreference) =>
        set({
          themePreference,
          theme: themePreference === 'system' ? getSystemTheme() : themePreference,
        }),
      setResolvedTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name: 'nova-app',
      version: 2,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AppState>;
        const themePreference =
          state.themePreference === 'system' ||
          state.themePreference === 'light' ||
          state.themePreference === 'dark'
            ? state.themePreference
            : state.theme === 'dark'
              ? 'dark'
              : state.theme === 'light'
                ? 'light'
                : 'system';
        return {
          ...state,
          themePreference,
          theme: themePreference === 'system' ? getSystemTheme() : themePreference,
        };
      },
    },
  ),
);
