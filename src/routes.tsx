import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Voluntariado from './pages/Voluntariado';
import AdminVoluntarios from './pages/admin/AdminVoluntarios';
import TournamentBracket from './pages/admin/TournamentBracket';
import AdminLogin from './pages/admin/AdminLogin';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Voluntariado />} />
        <Route path="/voluntariado" element={<Voluntariado />} />

        {/* Confirmação de Credenciais do Administrador */}
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

        {/* Qualquer outra rota volta ao início */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;