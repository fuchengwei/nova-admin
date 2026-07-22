import { Layout, Menu, Dropdown, Avatar, Space, Button, theme as antdTheme } from 'antd';
import {
  DashboardOutlined,
  SettingOutlined,
  MonitorOutlined,
  CloudServerOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore, type Locale } from '@/stores/appStore';
import { useUserStore } from '@/stores/userStore';
import { clearTokens } from '@/utils/request';

const { Header, Sider, Content } = Layout;

const menus = [
  { key: '/dashboard', icon: <DashboardOutlined />, labelKey: 'menu.dashboard' },
  { key: '/system', icon: <SettingOutlined />, labelKey: 'menu.system' },
  { key: '/monitor', icon: <MonitorOutlined />, labelKey: 'menu.monitor' },
  { key: '/infra', icon: <CloudServerOutlined />, labelKey: 'menu.infra' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { locale, sidebarCollapsed, toggleSidebar, setLocale } = useAppStore();
  const { userInfo, reset } = useUserStore();
  const { token } = antdTheme.useToken();

  const items = menus.map((m) => ({
    key: m.key,
    icon: m.icon,
    label: t(m.labelKey),
  }));

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
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') {
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
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
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
