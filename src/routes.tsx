import { createBrowserRouter } from 'react-router-dom';
import Voluntariado from './pages/Voluntariado';
import AdminVoluntarios from './pages/admin/AdminVoluntarios';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Voluntariado />,
  },
  {
    path: '/voluntariado',
    element: <Voluntariado />,
  },
  {
    path: '/admin/voluntarios',
    element: <AdminVoluntarios />,
  },
]);