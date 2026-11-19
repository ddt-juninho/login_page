import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import Voluntariado from './pages/Voluntariado';
import PublicTournamentBracket from './pages/PublicTournamentBracket';
import AdminVoluntarios from './pages/admin/AdminVoluntarios';
import TournamentBracket from './pages/admin/TournamentBracket';
import AdminLogin from './pages/admin/AdminLogin';
import ProtectedAdminRoute, {
  revokeAdminSession,
} from './components/ProtectedAdminRoute';
import LoadingScreen from './components/LoadingScreen';

// Revoga a permissão de admin sempre que o utilizador navegar para fora de /admin/*
function RouteSecurityWatcher() {
  const location = useLocation();

  useEffect(() => {
    const isAdminRoute =
      location.pathname.startsWith('/admin/voluntarios') ||
      location.pathname.startsWith('/admin/mapa');

    if (!isAdminRoute) {
      revokeAdminSession();
    }
  }, [location.pathname]);

  return null;
}

export default function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <LoadingScreen message="A preparar arena..." />;
  }

  return (
    <BrowserRouter>
      <RouteSecurityWatcher />
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Voluntariado />} />
        <Route path="/voluntariado" element={<Voluntariado />} />
        <Route path="/mapa" element={<PublicTournamentBracket />} />

        {/* Login do Administrador */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Rotas Administrativas Protegidas */}
        <Route
          path="/admin/voluntarios"
          element={
            <ProtectedAdminRoute>
              <AdminVoluntarios />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/mapa"
          element={
            <ProtectedAdminRoute>
              <TournamentBracket />
            </ProtectedAdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}