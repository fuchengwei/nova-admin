import { type ProLayoutProps } from '@ant-design/pro-components';
import type { MenuInfo } from '@/types/api';
import { getIcon } from '@/components/IconPicker/icon-catalog';

/** ProLayout 路由树节点（与 ProLayoutProps['route'] 结构一致） */
export type LayoutRoute = NonNullable<ProLayoutProps['route']>;

export { getIcon };

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
      icon: getIcon('SettingOutlined'),
      routes: [
        { path: '/system/dept', name: t('menu.dept'), icon: getIcon('ApartmentOutlined') },
        { path: '/system/user', name: t('menu.user'), icon: getIcon('UserOutlined') },
        { path: '/system/role', name: t('menu.role'), icon: getIcon('TeamOutlined') },
        { path: '/system/menu', name: t('menu.menu'), icon: getIcon('MenuOutlined') },
        { path: '/system/dict', name: t('menu.dict'), icon: getIcon('BookOutlined') },
        { path: '/system/log', name: t('menu.log'), icon: getIcon('FileOutlined') },
        { path: '/tool/gen', name: t('menu.gen'), icon: getIcon('CodeOutlined') },
      ],
    },
    {
      path: '/infra',
      name: t('menu.infra'),
      icon: getIcon('CloudServerOutlined'),
      routes: [{ path: '/infra/file', name: t('menu.file'), icon: getIcon('FileOutlined') }],
    },
    {
      path: '/monitor',
      name: t('menu.monitor'),
      icon: getIcon('MonitorOutlined'),
      routes: [
        { path: '/monitor/job', name: t('menu.job'), icon: getIcon('ScheduleOutlined') },
        { path: '/monitor/server', name: t('menu.server'), icon: getIcon('DashboardOutlined') },
      ],
    },
  ];
}

/** 沿路由树查找当前路径对应的节点 */
export function findRouteNode(routes: LayoutRoute[] = [], path: string): LayoutRoute | undefined {
  for (const r of routes) {
    if (r.path === path) return r;
    if (r.routes) {
      const found = findRouteNode(r.routes, path);
      if (found) return found;
    }
  }
  return undefined;
}
