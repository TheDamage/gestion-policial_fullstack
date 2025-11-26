import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';
import Capacitaciones from './pages/Capacitaciones';
import MisCapacitaciones from './pages/MisCapacitaciones';
import CapacitacionesDashboard from './pages/CapacitacionesDashboard';

export default function CiberFormar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      path: '/ciberformar',
      icon: '📊',
      permission: 'capacitaciones.ver'
    },
    {
      name: 'Capacitaciones',
      path: '/ciberformar/capacitaciones',
      icon: '📚',
      permission: 'capacitaciones.ver'
    },
    {
      name: 'Mis Capacitaciones',
      path: '/ciberformar/mis-capacitaciones',
      icon: '🎓',
      permission: null // Todos pueden ver sus propias capacitaciones
    }
  ];

  const isActiveRoute = (path) => {
    if (path === '/ciberformar') {
      return location.pathname === '/ciberformar';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-sm text-red-200 hover:text-white mb-2 flex items-center gap-2 transition-colors"
              >
                ← Volver al Dashboard Principal
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <span className="text-2xl">🎓</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold">CiberFormar PDBA</h1>
                  <p className="text-red-200 text-sm mt-1">
                    Sistema Integral de Formación y Desarrollo
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm opacity-75">Módulo de</div>
                <div className="font-semibold">Capacitaciones</div>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-xl">🔐</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 py-1">
            {navigation
              .filter(item => !item.permission || hasPermission(item.permission))
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                    isActiveRoute(item.path)
                      ? 'bg-red-100 text-red-700 border-2 border-red-200'
                      : 'text-gray-700 hover:text-red-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))
            }
          </div>
        </div>
      </nav>

      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-red-600 font-medium">CiberFormar</span>
              </li>
              {location.pathname !== '/ciberformar' && (
                <>
                  <li>
                    <span className="text-gray-400">/</span>
                  </li>
                  <li>
                    <span className="text-gray-900">
                      {getBreadcrumbTitle(location.pathname)}
                    </span>
                  </li>
                </>
              )}
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<CapacitacionesDashboard />} />
          <Route path="/capacitaciones" element={<Capacitaciones />} />
          <Route path="/mis-capacitaciones" element={<MisCapacitaciones />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 text-gray-600">
              <span className="text-lg">🛡️</span>
              <span className="text-sm">
                CiberFormar PDBA - Sistema de Gestión de Capacitaciones
              </span>
            </div>
            <div className="flex items-center space-x-6 mt-4 md:mt-0 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <span>📈</span>
                <span>Versión 2.0.0</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🔧</span>
                <span>Equilybrio Group</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📅</span>
                <span>2025</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Quick Actions Floating Button (Solo para administradores) */}
      {hasPermission('capacitaciones.crear') && (
        <QuickActionsFAB />
      )}
    </div>
  );
}

function getBreadcrumbTitle(pathname) {
  const titles = {
    '/ciberformar/capacitaciones': 'Capacitaciones',
    '/ciberformar/mis-capacitaciones': 'Mis Capacitaciones'
  };
  return titles[pathname] || 'Página';
}

function QuickActionsFAB() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const quickActions = [
    {
      name: 'Nueva Capacitación',
      icon: '➕',
      action: () => navigate('/ciberformar/capacitaciones?action=nueva'),
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      name: 'Asignación Masiva',
      icon: '👥',
      action: () => navigate('/ciberformar/capacitaciones?action=asignacion'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Exportar Datos',
      icon: '📊',
      action: () => navigate('/ciberformar/capacitaciones?action=export'),
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end space-y-3 z-40">
      {/* Action buttons */}
      {isOpen && (
        <div className="flex flex-col space-y-2 mb-2">
          {quickActions.map((action, index) => (
            <div
              key={index}
              className="flex items-center space-x-3 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <span className="bg-white px-3 py-1 rounded-lg shadow-md text-sm font-medium text-gray-700 whitespace-nowrap">
                {action.name}
              </span>
              <button
                onClick={() => {
                  action.action();
                  setIsOpen(false);
                }}
                className={`w-12 h-12 rounded-full text-white shadow-lg transition-all duration-200 transform hover:scale-110 ${action.color}`}
              >
                <span className="text-xl">{action.icon}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all duration-300 transform ${
          isOpen ? 'rotate-45 scale-110' : 'hover:scale-105'
        }`}
      >
        <span className="text-2xl">
          {isOpen ? '✕' : '⚡'}
        </span>
      </button>
    </div>
  );
}

// Importar useState para el FAB
import { useState } from 'react';

// Estilos CSS adicionales para animaciones
const additionalStyles = `
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out forwards;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
`;

// Inyectar estilos si no están presentes
if (typeof document !== 'undefined' && !document.getElementById('ciberformar-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'ciberformar-styles';
  styleSheet.textContent = additionalStyles;
  document.head.appendChild(styleSheet);
}