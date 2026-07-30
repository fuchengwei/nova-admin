import { useEffect, useState, useMemo, useRef } from 'react';
import { Dropdown, Avatar, Space, Button, App as AntdApp, theme as antdTheme, Spin } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProLayout } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { getPublicBasicSettings } from '@/api/settings';
import SystemNotice from '@/components/SystemNotice';
import PasswordChangeGate from '@/components/PasswordChangeGate';
import { useAppStore, type Locale } from '@/stores/appStore';
import { useUserStore } from '@/stores/userStore';
import { clearTokens, getToken } from '@/utils/request';
import { getUserInfo, getUserMenus, logout as apiLogout } from '@/api/auth';
import { toLayoutRoutes, findRouteNode } from '@/utils/layout';
import { useSessionEvents } from '@/hooks/useSessionEvents';

const normalizeImageSrc = (value?: string | null) => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { locale, sidebarCollapsed, setLocale, theme } = useAppStore();
  const { setUserInfo, menus, setMenus, permissions, reset } = useUserStore();
  const userInfo = useUserStore((s) => s.userInfo);
  const { modal } = AntdApp.useApp();
  const { token } = antdTheme.useToken();
  const [menusLoaded, setMenusLoaded] = useState(false);
  const ignoreSessionRevocationRef = useRef(false);
  const { data: basicSettings } = useQuery({
    queryKey: ['settings', 'public-basic'],
    queryFn: async () => {
      const res = await getPublicBasicSettings();
      return res.code === 0 ? res.data : undefined;
    },
  });

  // 挂载时并行拉取用户信息 + 菜单，保证 permissions 始终是服务端最新值
  useEffect(() => {
    if (!getToken()) return;
    const loadIdentity = async () => {
      try {
        const infoRes = await getUserInfo();
        if (infoRes.code !== 0 || !infoRes.data) return;
        setUserInfo(infoRes.data);
        if (infoRes.data.passwordChangeRequired) {
          setMenus([]);
          return;
        }
        const menuRes = await getUserMenus();
        if (menuRes.code === 0 && menuRes.data) setMenus(menuRes.data);
      } catch {
        // 请求拦截器统一处理登录过期和其他异常。
      } finally {
        setMenusLoaded(true);
      }
    };
    void loadIdentity();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useSessionEvents({
    onSessionRevoked: () => {
      if (ignoreSessionRevocationRef.current || !getToken()) return false;
      clearTokens();
      reset();
      modal.warning({
        title: t('request.sessionRevokedTitle'),
        content: t('request.sessionRevoked'),
        okText: t('common.confirm'),
      });
      navigate('/login', { replace: true });
      return true;
    },
  });

  // 构建 ProLayout 路由树：Dashboard 根 + 后端菜单
  // menus 初始为 []，加载完成后由 setMenus 触发重渲染，严格按后端排序展示
  const route = useMemo(
    () => ({
      path: '/',
      routes: [
        { path: '/dashboard', name: t('menu.dashboard'), icon: <DashboardOutlined /> },
        ...toLayoutRoutes(menus, permissions),
      ],
    }),
    [menus, permissions, t],
  );

  // 同步浏览器标签标题为当前路由菜单名
  useEffect(() => {
    const node = findRouteNode(route.routes ?? [], location.pathname);
    const title = node?.name;
    const browserTitle = basicSettings?.browserTitle || basicSettings?.systemName || 'Nova Admin';
    document.title = title ? `${title} - ${browserTitle}` : browserTitle;
  }, [basicSettings?.browserTitle, basicSettings?.systemName, location.pathname, route]);

  const langMenu = {
    items: [
      { key: 'zh_CN', label: '中文' },
      { key: 'en_US', label: 'English' },
    ],
    onClick: ({ key }: { key: string }) => {
      const next = key as Locale;
      setLocale(next);
      i18n.changeLanguage(next);
    },
  };

  const canOpenSettings =
    userInfo?.roles?.includes('super_admin') ||
    permissions.includes('system:settings:view') ||
    permissions.includes('system:settings:edit');

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: t('header.profile') },
      ...(canOpenSettings
        ? [{ key: 'settings', icon: <SettingOutlined />, label: t('menu.settings') }]
        : []),
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: t('header.logout'), danger: true },
    ],
    onClick: async ({ key }: { key: string }) => {
      if (key === 'profile') {
        navigate('/profile');
        return;
      }
      if (key === 'settings') {
        navigate('/system/settings');
        return;
      }
      if (key === 'logout') {
        ignoreSessionRevocationRef.current = true;
        try {
          await apiLogout();
        } catch {
          // 忽略错误，继续本地清理
        }
        clearTokens();
        navigate('/login');
        reset();
      }
    },
  };

  const safeAvatarSrc = normalizeImageSrc(userInfo?.avatar);
  const safeLogoSrc = normalizeImageSrc(basicSettings?.logoUrl);
  const systemName = basicSettings?.systemName || 'Nova Admin';

  // 菜单未加载时显示加载器，避免 ProLayout 缓存空菜单树
  if (!menusLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" description={t('common.loading') ?? '加载中...'} />
      </div>
    );
  }

  if (userInfo?.passwordChangeRequired) {
    return (
      <PasswordChangeGate
        required
        onPasswordChangeStart={() => {
          ignoreSessionRevocationRef.current = true;
        }}
        onPasswordChangeFailed={() => {
          ignoreSessionRevocationRef.current = false;
        }}
      />
    );
  }

  return (
    <ProLayout
      title={false}
      logo={
        <div className="flex items-center gap-3 whitespace-nowrap">
          {safeLogoSrc ? (
            <img src={safeLogoSrc} alt={systemName} className="h-10 w-10 object-contain" />
          ) : (
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold"
              style={{ backgroundColor: token.colorPrimary, color: token.colorWhite }}
            >
              {systemName.slice(0, 1)}
            </span>
          )}
          <span className="text-lg font-bold" style={{ color: token.colorPrimary }}>
            {systemName}
          </span>
        </div>
      }
      // mix 布局下顶部 Header 正常渲染，actionsRender 生效（side 布局会被库强制 return null）
      // 不启用 splitMenus：完整菜单常驻侧栏，顶部仅放品牌 + 操作区
      layout="mix"
      style={{ height: '100vh', overflow: 'hidden' }}
      contentStyle={{
        height: 'calc(100vh - 56px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      navTheme={theme === 'dark' ? 'realDark' : 'light'}
      fixSiderbar
      siderWidth={220}
      breakpoint="lg"
      collapsed={sidebarCollapsed}
      onCollapse={(collapsed) => useAppStore.setState({ sidebarCollapsed: collapsed })}
      route={route}
      location={{ pathname: location.pathname }}
      menuItemRender={(item, dom) => {
        const hasChildren = Array.isArray((item as { routes?: unknown[] }).routes);
        if (hasChildren) return dom;
        return <a onClick={() => navigate(item.path ?? '/')}>{dom}</a>;
      }}
      actionsRender={(props) =>
        props.isMobile
          ? []
          : [
              <Dropdown key="lang" menu={langMenu} placement="bottomRight">
                <Button type="text" icon={<GlobalOutlined />}>
                  {locale === 'zh_CN' ? '中文' : 'English'}
                </Button>
              </Dropdown>,
              <Dropdown key="user" menu={userMenu} placement="bottomRight">
                <Space className="cursor-pointer">
                  <Avatar src={safeAvatarSrc} icon={<UserOutlined />} />
                  <span>{userInfo?.nickname ?? userInfo?.account ?? 'Admin'}</span>
                </Space>
              </Dropdown>,
            ]
      }
    >
      <SystemNotice />
      <div className="flex h-full flex-col overflow-hidden">
        <Outlet />
      </div>
    </ProLayout>
  );
}
