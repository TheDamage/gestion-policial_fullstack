import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/contexts/AuthContext';
import ProtectedRoute from './shared/components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ForgotPassword from './pages/ForgotPassword';
import Register from './pages/Register';

// Apps
import CarInfo from './apps/CarInfo';
import WhoIsWho from './apps/WhoIsWho';
import Protocolo360 from './apps/Protocolo360';
import CiberFormar from './apps/CiberFormar';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Dashboard - Ruta protegida básica */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Apps - Rutas protegidas con permisos específicos */}
          <Route
            path="/carinfo/*"
            element={
              <ProtectedRoute requiredPermission="carinfo.consultar">
                <CarInfo />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/whoiswho/*"
            element={
              <ProtectedRoute requiredPermission="whoiswho.consultar">
                <WhoIsWho />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/protocolo360/*"
            element={
              <ProtectedRoute requiredPermission="protocolo360.consultar">
                <Protocolo360 />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/ciberformar/*"
            element={
              <ProtectedRoute requiredPermission="ciberformar.acceder">
                <CiberFormar />
              </ProtectedRoute>
            }
          />
          
          {/* Redirección de raíz al dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Página 404 - No encontrada */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
                <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md w-full">
                  <div className="text-6xl mb-4">🔍</div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">404</h1>
                  <p className="text-xl text-gray-600 mb-6">Página no encontrada</p>
                  <p className="text-gray-500 mb-8">
                    La página que buscas no existe o fue movida.
                  </p>
                  <a 
                    href="/dashboard" 
                    className="inline-block bg-police-blue text-white px-6 py-3 rounded-md hover:bg-police-lightblue transition font-medium"
                  >
                    Volver al Dashboard
                  </a>
                </div>
              </div>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;