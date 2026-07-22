import { createBrowserRouter, Navigate } from 'react-router-dom';
import BlankLayout from '@/layouts/BlankLayout';
import AdminLayout from '@/layouts/AdminLayout';
import LoginPage from '@/pages/login';
import DashboardPage from '@/pages/dashboard';
import NotFoundPage from '@/pages/404';
import AuthGuard from '@/router/AuthGuard';

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
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
