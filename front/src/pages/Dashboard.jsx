import { Link } from 'react-router-dom';
import { useAuth } from '../shared/contexts/AuthContext';
import { useState } from 'react';
import techWaveLogo from '../assets/images/startwave.png';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [showAdditionalApps, setShowAdditionalApps] = useState(false);

  const apps = [
    {
      id: 'carinfo',
      name: 'CarInfo',
      description: 'Identificación Vehicular Táctica',
      icon: '🚗',
      path: '/carinfo',
      color: 'bg-blue-500',
      permission: null
    },
    {
      id: 'whoiswho',
      name: 'WhoIsWho',
      description: 'Directorio Institucional',
      icon: '👥',
      path: '/whoiswho',
      color: 'bg-green-500',
      permission: null
    },
    {
      id: 'protocolo360',
      name: 'Protocolo360',
      description: 'Manual Operativo Integral',
      icon: '📋',
      path: '/protocolo360',
      color: 'bg-purple-500',
      permission: null
    },
    {
      id: 'ciberformar',
      name: 'CiberFormar',
      description: 'Formación en Ciberseguridad',
      icon: '🎓',
      path: '/ciberformar',
      color: 'bg-red-500',
      permission: null
    },
    {
      id: 'kuantika',
      name: 'Kuantika AI',
      description: 'Asistente Virtual Inteligente',
      icon: '💬',
      path: 'https://www.kuantika.ai/',
      color: 'bg-indigo-500',
      permission: null,
      external: true
    }
  ];

  const additionalApps = [
    { name: 'PatrullajeSmart', description: 'Mapas y rutas por calor de eventos' },
    { name: 'EvidenciaChain', description: 'Cadena de custodia digital' },
    { name: 'DenunciaSimple', description: 'Canal rápido ciudadano' },
    { name: 'RadarVial', description: 'Registro de infracciones móviles' },
    { name: 'OperativosMap', description: 'Planificación de operativos' },
    { name: 'AnalyticaCrim', description: 'Datos delictivos por zona y periodo' },
    { name: 'CommsSecure', description: 'Mensajería interna cifrada' },
    { name: 'PatrimonioCheck', description: 'Consulta de objetos robados' },
    { name: 'LegalAssist', description: 'Modelos legales integrados' },
    { name: 'WhistleSafe', description: 'Denuncias anónimas internas' }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-police-blue text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src={techWaveLogo} 
                alt="TechWave Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold">Inicio - Apps</h1>
                <p className="text-blue-200 text-sm mt-1">Dashboard</p>
                <p className="text-blue-200 text-sm mt-1">
                  {user?.nombre} {user?.apellido} - {user?.rango}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                className="bg-white text-police-blue px-4 py-2 rounded-md hover:bg-gray-100 transition font-medium opacity-50 cursor-not-allowed"
                disabled
              >
                👤 Gestión de Usuarios
              </button>
              <button
                onClick={logout}
                className="bg-white text-police-blue px-4 py-2 rounded-md hover:bg-gray-100 transition font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Bienvenido/a, {user?.nombre}
          </h2>
          <p className="text-gray-600">
            Selecciona una aplicación para comenzar
          </p>
        </div>

        {/* Apps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map((app) => (
            <AppCard key={app.id} app={app} />
          ))}
        </div>

        {/* Additional Apps Button */}
        <div className="mt-8">
          <button
            onClick={() => setShowAdditionalApps(!showAdditionalApps)}
            className="w-full bg-white border-2 border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-all duration-200 flex items-center justify-between"
          >
            <span className="text-lg font-semibold text-gray-700">
              📱 Aplicaciones Adicionales
            </span>
            <span className="text-gray-500 text-2xl">
              {showAdditionalApps ? '−' : '+'}
            </span>
          </button>

          {showAdditionalApps && (
            <div className="mt-4 bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {additionalApps.map((app, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 rounded-lg p-4 opacity-50 cursor-not-allowed"
                  >
                    <h4 className="font-semibold text-gray-700 mb-1">
                      {app.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {app.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function AppCard({ app }) {
  const { hasPermission } = useAuth();

  const canAccess = !app.permission || hasPermission(app.permission);
  const isDisabled = app.disabled || !canAccess;

  // Si es un enlace externo
  if (app.external) {
    return (
      <a
        href={app.path}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-white rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
      >
        <div className={`${app.color} w-16 h-16 rounded-lg flex items-center justify-center text-3xl mb-4`}>
          {app.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {app.name}
        </h3>
        <p className="text-gray-600 text-sm">
          {app.description}
        </p>
      </a>
    );
  }

  // Si está deshabilitado, usar div
  if (isDisabled) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-200 opacity-50 cursor-not-allowed">
        <div className={`${app.color} w-16 h-16 rounded-lg flex items-center justify-center text-3xl mb-4`}>
          {app.icon}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {app.name}
        </h3>
        <p className="text-gray-600 text-sm">
          {app.description}
        </p>
        {app.disabled && (
          <span className="inline-block mt-3 text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-full">
            Próximamente
          </span>
        )}
        {!canAccess && !app.disabled && (
          <span className="inline-block mt-3 text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">
            Sin permisos
          </span>
        )}
      </div>
    );
  }

  // Si está habilitado, usar Link
  return (
    <Link
      to={app.path}
      className="bg-white rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
    >
      <div className={`${app.color} w-16 h-16 rounded-lg flex items-center justify-center text-3xl mb-4`}>
        {app.icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        {app.name}
      </h3>
      <p className="text-gray-600 text-sm">
        {app.description}
      </p>
    </Link>
  );
}