import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Voluntariado from './pages/Voluntariado';
import AdminVoluntarios from './pages/admin/AdminVoluntarios';
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
        <Route path="/" element={<Voluntariado />} />
        <Route path="/voluntariado" element={<Voluntariado />} />
        <Route path="/admin/voluntarios" element={<AdminVoluntarios />} />
      </Routes>
    </BrowserRouter>
  );
}