import { useEffect } from 'react';
import { ConfigProvider, App as AntdApp, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useQuery } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { getPublicBasicSettings } from '@/api/settings';
import { router } from '@/router';
import { useAppStore } from '@/stores/appStore';
import { setMessageApi } from '@/utils/message';
import i18n from './i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

function AppContent() {
  const locale = useAppStore((s) => s.locale);
  const localePreferenceSet = useAppStore((s) => s.localePreferenceSet);
  const themePreference = useAppStore((s) => s.themePreference);
  const theme = useAppStore((s) => s.theme);
  const setSystemLocale = useAppStore((s) => s.setSystemLocale);
  const setResolvedTheme = useAppStore((s) => s.setResolvedTheme);
  const antdLocale = locale === 'en_US' ? enUS : zhCN;
  const { data: basicSettings } = useQuery({
    queryKey: ['settings', 'public-basic'],
    queryFn: async () => {
      const res = await getPublicBasicSettings();
      return res.code === 0 ? res.data : undefined;
    },
  });

  // 让 i18n 语言与持久化的语言设置保持一致
  useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncTheme = () => {
      if (themePreference === 'system') setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    };
    syncTheme();
    if (themePreference !== 'system') return;
    mediaQuery.addEventListener('change', syncTheme);
    return () => mediaQuery.removeEventListener('change', syncTheme);
  }, [setResolvedTheme, themePreference]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    const defaultLanguage = basicSettings?.defaultLanguage;
    if (!localePreferenceSet && (defaultLanguage === 'zh_CN' || defaultLanguage === 'en_US')) {
      setSystemLocale(defaultLanguage);
    }
  }, [basicSettings?.defaultLanguage, localePreferenceSet, setSystemLocale]);

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: { colorPrimary: basicSettings?.themeColor || '#1677ff', borderRadius: 6 },
      }}
    >
      <AntdApp>
        <MessageContextBridge />
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  );
}

function MessageContextBridge() {
  const { message } = AntdApp.useApp();

  useEffect(() => {
    setMessageApi(message);
    return () => setMessageApi(null);
  }, [message]);

  return null;
}
