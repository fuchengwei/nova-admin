import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getToken } from '@/utils/request';

interface Props {
  children: ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const location = useLocation();
  const token = getToken();
  if (!token) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  return <>{children}</>;
}
