import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Resumidos from './pages/Resumidos';
import Completos from './pages/Completos';

export default function Protocolo360() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-purple-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-sm text-purple-200 hover:text-white mb-1 flex items-center gap-2"
              >
                ← Volver al Dashboard
              </button>
              <h1 className="text-2xl font-bold">📋 Protocolo360 PDBA</h1>
              <p className="text-purple-200 text-sm">Manual Operativo Integral</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-4 py-3">
            <NavLink to="/protocolo360">Protocolos Resumidos</NavLink>
            <NavLink to="/protocolo360/completos">Protocolos Completos</NavLink>
          </div>
        </div>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Resumidos />} />
        <Route path="/completos" element={<Completos />} />
      </Routes>
    </div>
  );
}

function NavLink({ to, children }) {
  return (
    <Link
      to={to}
      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-100 rounded-md transition"
    >
      {children}
    </Link>
  );
}