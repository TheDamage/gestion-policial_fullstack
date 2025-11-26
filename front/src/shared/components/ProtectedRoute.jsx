import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredPermission, requiredRole }) {
  const { isAuthenticated, loading, user, hasPermission, hasRole } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-police-blue"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar permiso específico si se requiere
  /*if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-red-500 text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-6">
              No tienes los permisos necesarios para acceder a esta página.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-police-blue text-white px-6 py-2 rounded-md hover:bg-police-lightblue transition"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }*/

  // Verificar rol específico si se requiere
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="text-red-500 text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-6">
              Esta página requiere el rol de {requiredRole}.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-police-blue text-white px-6 py-2 rounded-md hover:bg-police-lightblue transition"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Usuario autenticado y con permisos correctos
  return children;
}