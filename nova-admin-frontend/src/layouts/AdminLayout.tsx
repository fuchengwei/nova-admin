import { useEffect, useState, useMemo } from 'react';
import { Layout, Menu, Dropdown, Avatar, Space, Button, Spin, theme as antdTheme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import * as Icons from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore, type Locale } from '@/stores/appStore';
import { useUserStore } from '@/stores/userStore';
import { clearTokens } from '@/utils/request';
import { getUserInfo, getUserMenus, logout as apiLogout } from '@/api/auth';
import type { MenuInfo } from '@/types/api';

const { Header, Sider, Content } = Layout;

/** 图标名称 → React 组件映射 */
const iconMap: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  SettingOutlined: <Icons.SettingOutlined />,
  MonitorOutlined: <Icons.MonitorOutlined />,
  CloudServerOutlined: <Icons.CloudServerOutlined />,
  ApartmentOutlined: <Icons.ApartmentOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <Icons.TeamOutlined />,
  MenuOutlined: <Icons.MenuOutlined />,
  FileOutlined: <Icons.FileOutlined />,
  ScheduleOutlined: <Icons.ScheduleOutlined />,
  CodeOutlined: <Icons.CodeOutlined />,
  SafetyOutlined: <Icons.SafetyOutlined />,
  TableOutlined: <Icons.TableOutlined />,
  BookOutlined: <Icons.BookOutlined />,
  ToolOutlined: <Icons.ToolOutlined />,
  BarChartOutlined: <Icons.BarChartOutlined />,
  LineChartOutlined: <Icons.LineChartOutlined />,
  PieChartOutlined: <Icons.PieChartOutlined />,
  DesktopOutlined: <Icons.DesktopOutlined />,
  DatabaseOutlined: <Icons.DatabaseOutlined />,
  GlobalOutlined: <GlobalOutlined />,
  AppstoreOutlined: <Icons.AppstoreOutlined />,
  ShopOutlined: <Icons.ShopOutlined />,
  ShoppingOutlined: <Icons.ShoppingOutlined />,
  NotificationOutlined: <Icons.NotificationOutlined />,
  SoundOutlined: <Icons.SoundOutlined />,
  TagOutlined: <Icons.TagOutlined />,
  ProfileOutlined: <Icons.ProfileOutlined />,
  FormOutlined: <Icons.FormOutlined />,
  ContainerOutlined: <Icons.ContainerOutlined />,
  HomeOutlined: <Icons.HomeOutlined />,
};

/** 获取图标组件 */
function getIcon(iconName?: string): React.ReactNode {
  if (!iconName) return undefined;
  return iconMap[iconName] ?? <Icons.AppstoreOutlined />;
}

/** 将后端菜单数据转为 Ant Design Menu items */
function convertMenus(menus: MenuInfo[]): any[] {
  return menus
    .filter((m) => m.visible !== 0)
    .map((m) => {
      const item: any = {
        key: m.path || String(m.id),
        icon: getIcon(m.icon),
        label: m.name,
      };
      if (m.children && m.children.length > 0) {
        const filteredChildren = convertMenus(m.children);
        // 过滤后没有可见子项时不要挂 children，否则 antd Menu 会渲染展开箭头
        if (filteredChildren.length > 0) {
          item.children = filteredChildren;
        }
      }
      return item;
    });
}

/** 从菜单树中收集所有可展开的 key（有子菜单的节点） */
function collectOpenKeys(menus: MenuInfo[]): string[] {
  const keys: string[] = [];
  function walk(items: MenuInfo[]) {
    for (const item of items) {
      if (item.children && item.children.length > 0) {
        keys.push(item.path || String(item.id));
        walk(item.children);
      }
    }
  }
  walk(menus);
  return keys;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { locale, sidebarCollapsed, toggleSidebar, setLocale } = useAppStore();
  const { userInfo, setUserInfo, menus, setMenus, reset } = useUserStore();
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
            // 加载菜单
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
      // 有用户信息但没菜单，加载菜单
      getUserMenus()
        .then((res) => {
          if (res.code === 0 && res.data) setMenus(res.data);
        })
        .catch(() => undefined);
    }
  }, [userInfo, setUserInfo, menus, setMenus]);

  // 构建侧边栏菜单项：Dashboard + 后端菜单
  const menuItems = useMemo(() => {
    const dashboard = { key: '/dashboard', icon: <DashboardOutlined />, label: t('menu.dashboard') };
    if (menus.length > 0) {
      const dynamicItems = convertMenus(menus);
      return [dashboard, ...dynamicItems];
    }
    // 后端菜单未加载时显示固定菜单
    return [
      dashboard,
      {
        key: '/system',
        icon: <Icons.SettingOutlined />,
        label: t('menu.system'),
        children: [
          { key: '/system/dept', icon: <Icons.ApartmentOutlined />, label: t('menu.dept') },
          { key: '/system/user', icon: <UserOutlined />, label: t('menu.user') },
          { key: '/system/role', icon: <Icons.TeamOutlined />, label: t('menu.role') },
          { key: '/system/menu', icon: <Icons.MenuOutlined />, label: t('menu.menu') },
          { key: '/system/dict', icon: <Icons.BookOutlined />, label: t('menu.dict') },
          { key: '/system/log', icon: <Icons.FileOutlined />, label: t('menu.log') },
          { key: '/tool/gen', icon: <Icons.CodeOutlined />, label: t('menu.gen') },
        ],
      },
      {
        key: '/infra',
        icon: <Icons.CloudServerOutlined />,
        label: t('menu.infra'),
        children: [
          { key: '/infra/file', icon: <Icons.FileOutlined />, label: t('menu.file') },
        ],
      },
      {
        key: '/monitor',
        icon: <Icons.MonitorOutlined />,
        label: t('menu.monitor'),
        children: [
          { key: '/monitor/job', icon: <Icons.ScheduleOutlined />, label: t('menu.job') },
          { key: '/monitor/server', icon: <Icons.DashboardOutlined />, label: t('menu.server') },
        ],
      },
    ];
  }, [menus, t]);

  // 收集所有含子菜单的父级 key，默认全部展开，保证功能菜单可见
  const parentKeys = useMemo(() => collectOpenKeys(menuItems), [menuItems]);

  // 根据当前路径查找祖先链
  function findParentKeys(
    items: any[],
    target: string,
    parents: string[] = [],
  ): string[] {
    for (const item of items) {
      if (item.key === target) return parents;
      if (item.children) {
        const found = findParentKeys(item.children, target, [...parents, item.key]);
        if (found.length > 0) return found;
      }
    }
    return [];
  }

  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 菜单加载后默认展开所有父级；切换路由时额外展开当前路由的祖先节点
  useEffect(() => {
    const routeParents = findParentKeys(menuItems, location.pathname);
    setOpenKeys((prev) =>
      Array.from(new Set([...prev, ...parentKeys, ...routeParents])),
    );
  }, [location.pathname, parentKeys, menuItems]);

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
    <Layout className="h-screen">
      <Sider
        collapsible
        collapsed={sidebarCollapsed}
        onCollapse={toggleSidebar}
        theme="light"
        width={220}
        className="!border-r border-gray-200"
      >
        <div
          className="h-16 flex items-center justify-center text-xl font-bold"
          style={{ color: token.colorPrimary }}
        >
          {sidebarCollapsed ? 'N' : 'Nova Admin'}
        </div>
        {menuLoading ? (
          <div className="flex justify-center py-8">
            <Spin />
          </div>
        ) : (
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            openKeys={sidebarCollapsed ? [] : openKeys}
            onOpenChange={(keys) => setOpenKeys(keys)}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        )}
      </Sider>
      <Layout>
        <Header
          className="!px-4 flex items-center justify-between !bg-white"
          style={{ borderBottom: '1px solid #f0f0f0' }}
        >
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
          />
          <Space size="middle">
            <Dropdown menu={langMenu} placement="bottomRight">
              <Button type="text" icon={<GlobalOutlined />}>
                {locale === 'zh_CN' ? '中文' : 'English'}
              </Button>
            </Dropdown>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space className="cursor-pointer">
                <Avatar src={userInfo?.avatar} icon={<UserOutlined />} />
                <span>{userInfo?.nickname ?? userInfo?.username ?? 'Admin'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="!p-4 overflow-auto">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
