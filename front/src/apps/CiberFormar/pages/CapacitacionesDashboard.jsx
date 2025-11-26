import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import apiClient from '../../../shared/utils/apiClient';

export default function CapacitacionesDashboard() {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [recentCapacitaciones, setRecentCapacitaciones] = useState([]);
  const [proximasCapacitaciones, setProximasCapacitaciones] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [tendencias, setTendencias] = useState([]);
  const [periodo, setPeriodo] = useState('mes'); // mes, trimestre, año

  useEffect(() => {
    fetchDashboardData();
  }, [periodo]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, recentResponse, proximasResponse, alertasResponse, tendenciasResponse] = 
        await Promise.all([
          apiClient.get(`/capacitaciones/stats?periodo=${periodo}`),
          apiClient.get('/capacitaciones?limit=5&order=created_at&direction=desc'),
          apiClient.get('/capacitaciones?proximas=true&limit=5'),
          apiClient.get('/capacitaciones/alertas'),
          apiClient.get(`/capacitaciones/tendencias?periodo=${periodo}`)
        ]);

      if (statsResponse.data.success) setStats(statsResponse.data.data);
      if (recentResponse.data.success) setRecentCapacitaciones(recentResponse.data.data);
      if (proximasResponse.data.success) setProximasCapacitaciones(proximasResponse.data.data);
      if (alertasResponse.data.success) setAlertas(alertasResponse.data.data);
      if (tendenciasResponse.data.success) setTendencias(tendenciasResponse.data.data);
    } catch (error) {
      console.error('Error al cargar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentageChange = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Capacitaciones</h1>
        <p className="text-gray-600 mt-2">Resumen ejecutivo del estado de formación y desarrollo</p>
        
        <div className="mt-4 flex space-x-2">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="mes">Último mes</option>
            <option value="trimestre">Último trimestre</option>
            <option value="año">Último año</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Alertas importantes */}
          {alertas.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-amber-800 mb-3">⚠️ Alertas Importantes</h3>
              <div className="space-y-2">
                {alertas.map((alerta, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded border border-amber-200">
                    <div>
                      <div className="font-medium text-amber-900">{alerta.titulo}</div>
                      <div className="text-sm text-amber-700">{alerta.descripcion}</div>
                    </div>
                    <div className="text-xs text-amber-600">{alerta.fecha}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard
              title="Total Capacitaciones"
              value={stats.total_capacitaciones || 0}
              previousValue={stats.total_capacitaciones_anterior || 0}
              icon="📚"
              color="blue"
            />
            <KPICard
              title="Participantes Activos"
              value={stats.participantes_activos || 0}
              previousValue={stats.participantes_activos_anterior || 0}
              icon="👥"
              color="green"
            />
            <KPICard
              title="Tasa de Asistencia"
              value={`${stats.tasa_asistencia || 0}%`}
              previousValue={stats.tasa_asistencia_anterior || 0}
              suffix="%"
              icon="✓"
              color="emerald"
            />
            <KPICard
              title="Tasa de Aprobación"
              value={`${stats.tasa_aprobacion || 0}%`}
              previousValue={stats.tasa_aprobacion_anterior || 0}
              suffix="%"
              icon="🎓"
              color="purple"
            />
          </div>

          {/* Estadísticas por tipo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Capacitaciones por tipo */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Distribución por Tipo</h3>
              <div className="space-y-3">
                {stats.por_tipo?.map((tipo, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span>{getTipoIcon(tipo.tipo_formacion)}</span>
                        <span className="text-sm font-medium text-gray-700">{getTipoLabel(tipo.tipo_formacion)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 rounded-full h-2 w-24">
                        <div 
                          className="bg-red-600 rounded-full h-2 transition-all duration-300"
                          style={{ width: `${(tipo.cantidad / stats.total_capacitaciones) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 w-8">{tipo.cantidad}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estado de capacitaciones */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Estado Actual</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.proximas || 0}</div>
                  <div className="text-sm text-blue-800">Próximas</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.en_curso || 0}</div>
                  <div className="text-sm text-green-800">En Curso</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{stats.completadas || 0}</div>
                  <div className="text-sm text-gray-800">Completadas</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.caducadas || 0}</div>
                  <div className="text-sm text-red-800">Caducadas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tendencias y gráficos */}
          {tendencias.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Tendencias de Participación</h3>
              <div className="h-64 flex items-end justify-between space-x-2">
                {tendencias.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="bg-red-500 w-full rounded-t transition-all duration-300"
                      style={{ height: `${(item.participantes / Math.max(...tendencias.map(t => t.participantes))) * 200}px` }}
                    ></div>
                    <div className="text-xs text-gray-600 mt-2 text-center">
                      <div className="font-medium">{item.periodo}</div>
                      <div>{item.participantes}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Listas de capacitaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Capacitaciones recientes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">🆕 Capacitaciones Recientes</h3>
                <a href="/ciberformar" className="text-sm text-red-600 hover:text-red-700">Ver todas</a>
              </div>
              <div className="space-y-3">
                {recentCapacitaciones.map((capacitacion) => (
                  <div key={capacitacion.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{capacitacion.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(capacitacion.fecha).toLocaleDateString()} - {capacitacion.modalidad}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {capacitacion.es_obligatorio && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Obligatorio</span>
                      )}
                      <span className="text-xs text-gray-600">{capacitacion.participantes?.length || 0} part.</span>
                    </div>
                  </div>
                ))}
                {recentCapacitaciones.length === 0 && (
                  <div className="text-center text-gray-500 py-4">No hay capacitaciones recientes</div>
                )}
              </div>
            </div>

            {/* Próximas capacitaciones */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">⏰ Próximas Capacitaciones</h3>
                <a href="/ciberformar?estado=proximas" className="text-sm text-red-600 hover:text-red-700">Ver todas</a>
              </div>
              <div className="space-y-3">
                {proximasCapacitaciones.map((capacitacion) => (
                  <div key={capacitacion.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{capacitacion.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(capacitacion.fecha).toLocaleDateString()} - {capacitacion.modalidad}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {capacitacion.es_obligatorio && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Obligatorio</span>
                      )}
                      <span className="text-xs text-blue-600">
                        {Math.ceil((new Date(capacitacion.fecha) - new Date()) / (1000 * 60 * 60 * 24))} días
                      </span>
                    </div>
                  </div>
                ))}
                {proximasCapacitaciones.length === 0 && (
                  <div className="text-center text-gray-500 py-4">No hay capacitaciones programadas</div>
                )}
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hasPermission('capacitaciones.crear') && (
                <QuickActionCard
                  title="Nueva Capacitación"
                  description="Crear una nueva capacitación"
                  icon="➕"
                  href="/ciberformar?action=nueva"
                  color="red"
                />
              )}
              
              <QuickActionCard
                title="Asignación Masiva"
                description="Asignar personal a capacitaciones"
                icon="👥"
                href="/ciberformar?action=asignacion"
                color="blue"
              />
              
              <QuickActionCard
                title="Reportes"
                description="Generar reportes y estadísticas"
                icon="📊"
                href="/ciberformar?action=reportes"
                color="green"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ title, value, previousValue, icon, color, suffix = '' }) {
  const change = previousValue ? Math.round(((value - previousValue) / previousValue) * 100) : 0;
  const isPositive = change > 0;
  
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800'
  };

  return (
    <div className={`rounded-lg p-6 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
      {previousValue > 0 && (
        <div className="mt-2 flex items-center text-sm">
          <span className={`inline-flex items-center ${
            isPositive ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {isPositive ? '↗️' : change < 0 ? '↘️' : '➖'}
            <span className="ml-1">
              {Math.abs(change)}% vs período anterior
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function QuickActionCard({ title, description, icon, href, color }) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 hover:bg-red-100 text-red-800',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800',
    green: 'bg-green-50 border-green-200 hover:bg-green-100 text-green-800'
  };

  return (
    <a
      href={href}
      className={`block p-4 rounded-lg border transition-colors ${colorClasses[color]}`}
    >
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm opacity-75">{description}</div>
        </div>
      </div>
    </a>
  );
}

function getTipoIcon(tipo) {
  const icons = {
    'ciberseguridad': '🔐',
    'academia_mensual': '🎓',
    'curso_regular': '📚',
    'taller': '🔧',
    'seminario': '🎤',
    'webinar': '💻'
  };
  return icons[tipo] || '📋';
}

function getTipoLabel(tipo) {
  const labels = {
    'ciberseguridad': 'Ciberseguridad',
    'academia_mensual': 'Academia Mensual',
    'curso_regular': 'Curso Regular',
    'taller': 'Taller',
    'seminario': 'Seminario',
    'webinar': 'Webinar'
  };
  return labels[tipo] || tipo;
}