import * as Icons from '@ant-design/icons';
import {
  DashboardOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { type ProLayoutProps } from '@ant-design/pro-components';
import type { MenuInfo } from '@/types/api';

/** ProLayout 路由树节点（与 ProLayoutProps['route'] 结构一致） */
export type LayoutRoute = NonNullable<ProLayoutProps['route']>;

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
  GlobalOutlined: <Icons.GlobalOutlined />,
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
export function getIcon(iconName?: string): React.ReactNode {
  if (!iconName) return undefined;
  return iconMap[iconName] ?? <Icons.AppstoreOutlined />;
}

/** 判断用户是否拥有菜单所需权限（超级管理员 *:*:* 豁免） */
export function hasPermission(perms?: string, permissions: string[] = []): boolean {
  if (!perms) return true;
  if (permissions.includes('*:*:*')) return true;
  return perms.split(',').some((p) => permissions.includes(p.trim()));
}

/** 将后端菜单递归转为 ProLayout 路由树，过滤隐藏项与无权限项 */
export function toLayoutRoutes(menus: MenuInfo[], permissions: string[]): LayoutRoute[] {
  const routes: LayoutRoute[] = [];
  for (const m of menus) {
    if (m.visible === 0) continue;
    if (!hasPermission(m.perms, permissions)) continue;
    const route: LayoutRoute = {
      path: m.path,
      name: m.name,
      icon: getIcon(m.icon),
    };
    if (m.children && m.children.length > 0) {
      const childRoutes = toLayoutRoutes(m.children, permissions);
      if (childRoutes.length > 0) route.routes = childRoutes;
    }
    routes.push(route);
  }
  return routes;
}

/** 后端菜单未加载时的静态兜底路由树 */
export function fallbackRoutes(t: (key: string) => string): LayoutRoute[] {
  return [
    {
      path: '/system',
      name: t('menu.system'),
      icon: <Icons.SettingOutlined />,
      routes: [
        { path: '/system/dept', name: t('menu.dept'), icon: <Icons.ApartmentOutlined /> },
        { path: '/system/user', name: t('menu.user'), icon: <UserOutlined /> },
        { path: '/system/role', name: t('menu.role'), icon: <Icons.TeamOutlined /> },
        { path: '/system/menu', name: t('menu.menu'), icon: <Icons.MenuOutlined /> },
        { path: '/system/dict', name: t('menu.dict'), icon: <Icons.BookOutlined /> },
        { path: '/system/log', name: t('menu.log'), icon: <Icons.FileOutlined /> },
        { path: '/tool/gen', name: t('menu.gen'), icon: <Icons.CodeOutlined /> },
      ],
    },
    {
      path: '/infra',
      name: t('menu.infra'),
      icon: <Icons.CloudServerOutlined />,
      routes: [{ path: '/infra/file', name: t('menu.file'), icon: <Icons.FileOutlined /> }],
    },
    {
      path: '/monitor',
      name: t('menu.monitor'),
      icon: <Icons.MonitorOutlined />,
      routes: [
        { path: '/monitor/job', name: t('menu.job'), icon: <Icons.ScheduleOutlined /> },
        { path: '/monitor/server', name: t('menu.server'), icon: <DashboardOutlined /> },
      ],
    },
  ];
}

/** 沿路由树查找当前路径对应的节点 */
export function findRouteNode(
  routes: LayoutRoute[] = [],
  path: string,
): LayoutRoute | undefined {
  for (const r of routes) {
    if (r.path === path) return r;
    if (r.routes) {
      const found = findRouteNode(r.routes, path);
      if (found) return found;
    }
  }
  return undefined;
}
