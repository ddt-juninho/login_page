import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Voluntariado from './pages/Voluntariado';
import AdminVoluntarios from './pages/admin/AdminVoluntarios';
import TournamentBracket from './pages/admin/TournamentBracket';
import AdminLogin from './pages/admin/AdminLogin';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import LoadingScreen from './components/LoadingScreen';

export default function App() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1800); // Tempo em milissegundos (1.8s)

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <LoadingScreen message="A preparar plataforma de voluntariado..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Voluntariado />} />
        <Route path="/voluntariado" element={<Voluntariado />} />

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

        {/* Qualquer rota inválida volta para o início */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}