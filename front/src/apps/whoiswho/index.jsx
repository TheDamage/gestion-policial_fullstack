import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Busqueda from './pages/Busqueda';
import Organigrama from './pages/Organigrama';
import Dependencias from './pages/Dependencias';

export default function WhoIsWho() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-sm text-green-200 hover:text-white mb-1 flex items-center gap-2"
              >
                ← Volver al Dashboard
              </button>
              <h1 className="text-2xl font-bold">👥 WhoIsWho PDBA</h1>
              <p className="text-green-200 text-sm">Directorio Institucional</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-4 py-3">
            <NavLink to="/whoiswho">Búsqueda</NavLink>
            <NavLink to="/whoiswho/organigrama">Organigrama</NavLink>
            <NavLink to="/whoiswho/dependencias">Dependencias</NavLink>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Busqueda />} />
        <Route path="/organigrama" element={<Organigrama />} />
        <Route path="/dependencias" element={<Dependencias />} />
      </Routes>
    </div>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-100 rounded-md transition"
    >
      {children}
    </Link>
  );
}