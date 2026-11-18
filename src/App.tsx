import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Voluntariado from './pages/Voluntariado';
import AdminVoluntarios from './pages/admin/AdminVoluntarios';
import TournamentBracket from './pages/admin/TournamentBracket';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Voluntariado />} />
        <Route path="/voluntariado" element={<Voluntariado />} />
        <Route path="/admin/voluntarios" element={<AdminVoluntarios />} />
        <Route path="/admin/mapa" element={<TournamentBracket />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
