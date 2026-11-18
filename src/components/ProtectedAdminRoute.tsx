import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export const ADMIN_AUTH_KEY = 'mk_tournament_admin_authenticated';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({
  children,
}: ProtectedAdminRouteProps) {
  const location = useLocation();
  const isAuthenticated = sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}