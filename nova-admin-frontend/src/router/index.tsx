import { createBrowserRouter, Navigate } from 'react-router-dom';
import BlankLayout from '@/layouts/BlankLayout';
import AdminLayout from '@/layouts/AdminLayout';
import LoginPage from '@/pages/login';
import DashboardPage from '@/pages/dashboard';
import NotFoundPage from '@/pages/404';
import AuthGuard from '@/router/AuthGuard';

// 系统管理
import DeptPage from '@/pages/system/dept';
import UserPage from '@/pages/system/user';
import RolePage from '@/pages/system/role';
import MenuPage from '@/pages/system/menu';
import DictPage from '@/pages/system/dict';
import LogPage from '@/pages/system/log';

// 基础设施
import FilePage from '@/pages/infra/file';

/** 路由路径 → 组件映射 */
const componentMap: Record<string, () => React.JSX.Element> = {
  '/dashboard': DashboardPage,
  '/system/dept': DeptPage,
  '/system/user': UserPage,
  '/system/role': RolePage,
  '/system/menu': MenuPage,
  '/system/dict': DictPage,
  '/system/log': LogPage,
  '/infra/file': FilePage,
};

/** 根据菜单数据动态生成路由 */
export function buildRoutes(menus: { path?: string; type?: string; children?: any[] }[]) {
  const routes: { path: string; element: React.JSX.Element }[] = [];

  function walk(items: any[]) {
    for (const item of items) {
      // 菜单类型(C)且有 path 且有对应组件
      if (item.type === 'C' && item.path && componentMap[item.path]) {
        routes.push({ path: item.path.replace(/^\//, ''), element: componentMap[item.path]() });
      }
      if (item.children) walk(item.children);
    }
  }

  walk(menus);
  return routes;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <BlankLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AdminLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'system/dept', element: <DeptPage /> },
      { path: 'system/user', element: <UserPage /> },
      { path: 'system/role', element: <RolePage /> },
      { path: 'system/menu', element: <MenuPage /> },
      { path: 'system/dict', element: <DictPage /> },
      { path: 'system/log', element: <LogPage /> },
      { path: 'infra/file', element: <FilePage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
