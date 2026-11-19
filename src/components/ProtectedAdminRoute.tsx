import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export const ADMIN_AUTH_KEY = 'mk_tournament_admin_authenticated';
const ADMIN_AUTH_EXPIRES_KEY = 'mk_tournament_admin_expires_at';

// Sessão máxima de 15 minutos mesmo dentro do painel
const SESSION_DURATION_MS = 15 * 60 * 1000;

export function grantAdminSession() {
  sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
  sessionStorage.setItem(
    ADMIN_AUTH_EXPIRES_KEY,
    String(Date.now() + SESSION_DURATION_MS)
  );
}

export function revokeAdminSession() {
  sessionStorage.removeItem(ADMIN_AUTH_KEY);
  sessionStorage.removeItem(ADMIN_AUTH_EXPIRES_KEY);
}

export function isAdminSessionValid(): boolean {
  const flag = sessionStorage.getItem(ADMIN_AUTH_KEY);
  const expiresRaw = sessionStorage.getItem(ADMIN_AUTH_EXPIRES_KEY);

  if (flag !== 'true' || !expiresRaw) {
    revokeAdminSession();
    return false;
  }

  const expiresAt = Number(expiresRaw);
  if (Number.isNaN(expiresAt) || Date.now() > expiresAt) {
    revokeAdminSession();
    return false;
  }

  return true;
}

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({
  children,
}: ProtectedAdminRouteProps) {
  const location = useLocation();

  if (!isAdminSessionValid()) {
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