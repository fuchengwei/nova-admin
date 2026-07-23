import { useEffect, useState, useMemo } from 'react';
import { Dropdown, Avatar, Space, Button, theme as antdTheme } from 'antd';
import { DashboardOutlined, UserOutlined, LogoutOutlined, GlobalOutlined } from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ProLayout } from '@ant-design/pro-components';
import { useAppStore, type Locale } from '@/stores/appStore';
import { useUserStore } from '@/stores/userStore';
import { clearTokens } from '@/utils/request';
import { getUserInfo, getUserMenus, logout as apiLogout } from '@/api/auth';
import { toLayoutRoutes, fallbackRoutes, findRouteNode } from '@/utils/layout';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { locale, sidebarCollapsed, setLocale, theme } = useAppStore();
  const { userInfo, setUserInfo, menus, setMenus, permissions, reset } = useUserStore();
  const { token } = antdTheme.useToken();
  const [menuLoading, setMenuLoading] = useState(false);

  // 加载用户信息 + 菜单
  useEffect(() => {
    if (!userInfo) {
      setMenuLoading(true);
      getUserInfo()
        .then((res) => {
          if (res.code === 0 && res.data) {
            setUserInfo(res.data);
            return getUserMenus();
          }
          return undefined;
        })
        .then((res) => {
          if (res && res.code === 0 && res.data) {
            setMenus(res.data);
          }
        })
        .catch(() => undefined)
        .finally(() => setMenuLoading(false));
    } else if (menus.length === 0) {
      getUserMenus()
        .then((res) => {
          if (res.code === 0 && res.data) setMenus(res.data);
        })
        .catch(() => undefined);
    }
  }, [userInfo, setUserInfo, menus, setMenus]);

  // 构建 ProLayout 路由树：Dashboard 根 + 后端菜单（或静态兜底）
  const route = useMemo(
    () => ({
      path: '/',
      routes: [
        { path: '/dashboard', name: t('menu.dashboard'), icon: <DashboardOutlined /> },
        ...(menus.length > 0 ? toLayoutRoutes(menus, permissions) : fallbackRoutes(t)),
      ],
    }),
    [menus, permissions, t],
  );

  // 同步浏览器标签标题为当前路由菜单名
  useEffect(() => {
    const node = findRouteNode(route.routes ?? [], location.pathname);
    const title = node?.name;
    document.title = title ? `${title} - Nova Admin` : 'Nova Admin';
  }, [location.pathname, route]);

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

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: t('header.profile') },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: t('header.logout'), danger: true },
    ],
    onClick: async ({ key }: { key: string }) => {
      if (key === 'logout') {
        try {
          await apiLogout();
        } catch {
          // 忽略错误，继续本地清理
        }
        clearTokens();
        reset();
        navigate('/login');
      }
    },
  };

  return (
    <ProLayout
      title={false}
      logo={
        <span className="font-bold text-base" style={{ color: token.colorPrimary }}>
          Nova Admin
        </span>
      }
      // mix 布局下顶部 Header 正常渲染，actionsRender 生效（side 布局会被库强制 return null）
      // 不启用 splitMenus：完整菜单常驻侧栏，顶部仅放品牌 + 操作区
      layout="mix"
      navTheme={theme === 'dark' ? 'realDark' : 'light'}
      fixSiderbar
      siderWidth={220}
      breakpoint="lg"
      collapsed={sidebarCollapsed}
      onCollapse={(collapsed) => useAppStore.setState({ sidebarCollapsed: collapsed })}
      route={route}
      location={{ pathname: location.pathname }}
      loading={menuLoading}
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
                  <Avatar src={userInfo?.avatar} icon={<UserOutlined />} />
                  <span>{userInfo?.nickname ?? userInfo?.username ?? 'Admin'}</span>
                </Space>
              </Dropdown>,
            ]
      }
    >
      <Outlet />
    </ProLayout>
  );
}
