import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import apiClient from '../../../shared/utils/apiClient';
import CapacitacionModal from '../components/CapacitacionModal';
import ParticipantesModal from '../components/ParticipantesModal';
import AsignacionMasivaModal from '../components/AsignacionMasivaModal';
import ExportModal from '../components/ExportModal';

export default function Capacitaciones() {
  const { hasPermission } = useAuth();
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showParticipantesModal, setShowParticipantesModal] = useState(false);
  const [showAsignacionModal, setShowAsignacionModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedCapacitacion, setSelectedCapacitacion] = useState(null);
  const [selectedCapacitaciones, setSelectedCapacitaciones] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'
  
  const [filters, setFilters] = useState({
    search: '',
    area: '',
    modalidad: '',
    es_obligatorio: '',
    nivel_jerarquico: '',
    puesto: '',
    estado: '', // proximas, en_curso, completadas, caducadas
    fecha_desde: '',
    fecha_hasta: '',
    tipo_formacion: '' // ciberseguridad, academia_mensual, curso_regular
  });

  const canManage = hasPermission('capacitaciones.crear');
  const canExport = hasPermission('capacitaciones.exportar');

  useEffect(() => {
    fetchCapacitaciones();
  }, [filters]);

  const fetchCapacitaciones = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Filtros básicos
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params[key] = filters[key];
        }
      });

      const response = await apiClient.get('/capacitaciones', { params });
      
      if (response.data.success) {
        setCapacitaciones(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar capacitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta capacitación?')) return;

    try {
      await apiClient.delete(`/capacitaciones/${id}`);
      fetchCapacitaciones();
    } catch (error) {
      console.error('Error al eliminar:', error);
      alert('Error al eliminar la capacitación');
    }
  };

  const handleEdit = (capacitacion) => {
    setSelectedCapacitacion(capacitacion);
    setShowModal(true);
  };

  const handleViewParticipantes = (capacitacion) => {
    setSelectedCapacitacion(capacitacion);
    setShowParticipantesModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCapacitacion(null);
    fetchCapacitaciones();
  };

  const handleCloseParticipantesModal = () => {
    setShowParticipantesModal(false);
    setSelectedCapacitacion(null);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      area: '',
      modalidad: '',
      es_obligatorio: '',
      nivel_jerarquico: '',
      puesto: '',
      estado: '',
      fecha_desde: '',
      fecha_hasta: '',
      tipo_formacion: ''
    });
  };

  const handleBulkSelect = (capacitacionId) => {
    setSelectedCapacitaciones(prev => {
      if (prev.includes(capacitacionId)) {
        return prev.filter(id => id !== capacitacionId);
      }
      return [...prev, capacitacionId];
    });
  };

  const handleSelectAll = () => {
    if (selectedCapacitaciones.length === capacitaciones.length) {
      setSelectedCapacitaciones([]);
    } else {
      setSelectedCapacitaciones(capacitaciones.map(c => c.id));
    }
  };

  const handleAsignacionMasiva = () => {
    setShowAsignacionModal(true);
  };

  const handleDuplicate = async (capacitacion) => {
    try {
      const newCapacitacion = {
        ...capacitacion,
        nombre: `${capacitacion.nombre} (Copia)`,
        fecha: new Date().toISOString().split('T')[0],
        fecha_caducidad: null
      };
      delete newCapacitacion.id;
      delete newCapacitacion.created_at;
      delete newCapacitacion.updated_at;
      delete newCapacitacion.participantes;

      await apiClient.post('/capacitaciones', newCapacitacion);
      fetchCapacitaciones();
    } catch (error) {
      console.error('Error al duplicar:', error);
      alert('Error al duplicar la capacitación');
    }
  };

  // Obtener opciones únicas para filtros
  const areas = [...new Set(capacitaciones.map(c => c.area).filter(Boolean))];
  const puestos = [...new Set(capacitaciones.map(c => c.puesto).filter(Boolean))];
  const nivelesJerarquicos = ['Oficial Superior', 'Oficial Subalterno', 'Suboficial Superior', 'Suboficial Subalterno', 'Tropa'];
  const tiposFormacion = [
    { value: 'ciberseguridad', label: 'Formación en Ciberseguridad' },
    { value: 'academia_mensual', label: 'Academia Mensual' },
    { value: 'curso_regular', label: 'Curso Regular' }
  ];

  // Estadísticas
  const stats = {
    total: capacitaciones.length,
    obligatorias: capacitaciones.filter(c => c.es_obligatorio).length,
    proximas: capacitaciones.filter(c => new Date(c.fecha) > new Date()).length,
    completadas: capacitaciones.filter(c => {
      const totalParticipantes = c.participantes?.length || 0;
      const asistentes = c.participantes?.filter(p => p.asistio).length || 0;
      return totalParticipantes > 0 && (asistentes / totalParticipantes) >= 0.8;
    }).length,
    caducadas: capacitaciones.filter(c => 
      c.fecha_caducidad && new Date(c.fecha_caducidad) < new Date()
    ).length
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header con estadísticas */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Capacitaciones</h2>
            <p className="text-gray-600 text-sm mt-1">
              Sistema integral de formación y desarrollo
            </p>
          </div>
          <div className="flex space-x-3">
            {canExport && (
              <button
                onClick={() => setShowExportModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition font-medium"
              >
                📊 Exportar
              </button>
            )}
            {canManage && (
              <>
                <button
                  onClick={handleAsignacionMasiva}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium"
                >
                  👥 Asignación Masiva
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition font-medium"
                >
                  + Nueva Capacitación
                </button>
              </>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{stats.obligatorias}</div>
            <div className="text-sm text-gray-500">Obligatorias</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{stats.proximas}</div>
            <div className="text-sm text-gray-500">Próximas</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{stats.completadas}</div>
            <div className="text-sm text-gray-500">Completadas</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-2xl font-bold text-orange-600">{stats.caducadas}</div>
            <div className="text-sm text-gray-500">Caducadas</div>
          </div>
        </div>
      </div>

      {/* Filtros avanzados */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Búsqueda Inteligente
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Buscar por concepto..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tipo de Formación
            </label>
            <select
              value={filters.tipo_formacion}
              onChange={(e) => handleFilterChange('tipo_formacion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos los tipos</option>
              {tiposFormacion.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Nivel Jerárquico
            </label>
            <select
              value={filters.nivel_jerarquico}
              onChange={(e) => handleFilterChange('nivel_jerarquico', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos los niveles</option>
              {nivelesJerarquicos.map(nivel => (
                <option key={nivel} value={nivel}>{nivel}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Puesto
            </label>
            <select
              value={filters.puesto}
              onChange={(e) => handleFilterChange('puesto', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos los puestos</option>
              {puestos.map(puesto => (
                <option key={puesto} value={puesto}>{puesto}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={filters.estado}
              onChange={(e) => handleFilterChange('estado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todos</option>
              <option value="proximas">Próximas</option>
              <option value="en_curso">En curso</option>
              <option value="completadas">Completadas</option>
              <option value="caducadas">Caducadas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Modalidad
            </label>
            <select
              value={filters.modalidad}
              onChange={(e) => handleFilterChange('modalidad', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todas</option>
              <option value="Presencial">Presencial</option>
              <option value="Virtual">Virtual</option>
              <option value="Híbrida">Híbrida</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Área
            </label>
            <select
              value={filters.area}
              onChange={(e) => handleFilterChange('area', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="">Todas</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={filters.fecha_desde}
              onChange={(e) => handleFilterChange('fecha_desde', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filters.fecha_hasta}
              onChange={(e) => handleFilterChange('fecha_hasta', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {Object.values(filters).some(v => v) && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}
            
            {selectedCapacitaciones.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedCapacitaciones.length} seleccionada{selectedCapacitaciones.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded ${viewMode === 'cards' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              📱
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded ${viewMode === 'table' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
            >
              📋
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Cargando capacitaciones...</p>
        </div>
      ) : capacitaciones.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No hay capacitaciones que coincidan con los filtros</p>
          {canManage && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-red-600 hover:text-red-700 font-medium"
            >
              Crear la primera capacitación
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capacitaciones.map((capacitacion) => (
            <CapacitacionCard
              key={capacitacion.id}
              capacitacion={capacitacion}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onViewParticipantes={handleViewParticipantes}
              canManage={canManage}
              isSelected={selectedCapacitaciones.includes(capacitacion.id)}
              onSelect={handleBulkSelect}
            />
          ))}
        </div>
      ) : (
        <CapacitacionesTable
          capacitaciones={capacitaciones}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewParticipantes={handleViewParticipantes}
          canManage={canManage}
          selectedCapacitaciones={selectedCapacitaciones}
          onSelect={handleBulkSelect}
          onSelectAll={handleSelectAll}
        />
      )}

      {/* Modals */}
      {showModal && (
        <CapacitacionModal
          capacitacion={selectedCapacitacion}
          onClose={handleCloseModal}
        />
      )}

      {showParticipantesModal && selectedCapacitacion && (
        <ParticipantesModal
          capacitacion={selectedCapacitacion}
          onClose={handleCloseParticipantesModal}
        />
      )}

      {showAsignacionModal && (
        <AsignacionMasivaModal
          onClose={() => setShowAsignacionModal(false)}
          onSuccess={fetchCapacitaciones}
        />
      )}

      {showExportModal && (
        <ExportModal
          capacitaciones={capacitaciones}
          filters={filters}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

// Componente Card mejorado
function CapacitacionCard({ capacitacion, onEdit, onDelete, onDuplicate, onViewParticipantes, canManage, isSelected, onSelect }) {
  const totalParticipantes = capacitacion.participantes?.length || 0;
  const aprobados = capacitacion.participantes?.filter(p => p.aprobado).length || 0;
  const asistentes = capacitacion.participantes?.filter(p => p.asistio).length || 0;

  const isExpired = capacitacion.fecha_caducidad && 
    new Date(capacitacion.fecha_caducidad) < new Date();

  const isUpcoming = new Date(capacitacion.fecha) > new Date();
  const isPast = new Date(capacitacion.fecha) < new Date();

  const getStatusColor = () => {
    if (isExpired) return 'text-red-600';
    if (isUpcoming) return 'text-blue-600';
    if (isPast) return 'text-green-600';
    return 'text-gray-600';
  };

  const getTypeIcon = () => {
    switch (capacitacion.tipo_formacion) {
      case 'ciberseguridad': return '🔐';
      case 'academia_mensual': return '🎓';
      default: return '📚';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden ${isSelected ? 'ring-2 ring-red-500' : ''}`}>
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-start space-x-3 flex-1">
            {canManage && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(capacitacion.id)}
                className="mt-1"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-lg">{getTypeIcon()}</span>
                <h3 className="text-lg font-bold text-gray-800 flex-1">
                  {capacitacion.nombre}
                </h3>
              </div>
              <div className="flex flex-wrap gap-1">
                {capacitacion.es_obligatorio && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    Obligatorio
                  </span>
                )}
                {capacitacion.nivel_jerarquico && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {capacitacion.nivel_jerarquico}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
          {capacitacion.detalle || 'Sin descripción'}
        </p>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Fecha:</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {new Date(capacitacion.fecha).toLocaleDateString()}
            </span>
          </div>

          {capacitacion.modalidad && (
            <div className="flex justify-between">
              <span className="text-gray-500">Modalidad:</span>
              <span className="font-medium">{capacitacion.modalidad}</span>
            </div>
          )}

          {capacitacion.area && (
            <div className="flex justify-between">
              <span className="text-gray-500">Área:</span>
              <span className="font-medium">{capacitacion.area}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-gray-500">Participantes:</span>
            <span className="font-medium">{totalParticipantes}</span>
          </div>

          {totalParticipantes > 0 && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500">Asistieron:</span>
                <span className="font-medium text-blue-600">
                  {asistentes} ({totalParticipantes > 0 ? Math.round((asistentes / totalParticipantes) * 100) : 0}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Aprobados:</span>
                <span className="font-medium text-green-600">
                  {aprobados} ({totalParticipantes > 0 ? Math.round((aprobados / totalParticipantes) * 100) : 0}%)
                </span>
              </div>
            </>
          )}

          {isExpired && (
            <div className="flex justify-between">
              <span className="text-gray-500">Estado:</span>
              <span className="font-medium text-red-600">⚠️ Caducada</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
          <button
            onClick={() => onViewParticipantes(capacitacion)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Ver Participantes
          </button>

          {canManage && (
            <div className="flex space-x-2">
              <button
                onClick={() => onDuplicate(capacitacion)}
                className="text-gray-600 hover:text-gray-900 p-1"
                title="Duplicar"
              >
                📋
              </button>
              <button
                onClick={() => onEdit(capacitacion)}
                className="text-gray-600 hover:text-gray-900 p-1"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(capacitacion.id)}
                className="text-red-600 hover:text-red-900 p-1"
                title="Eliminar"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente Table
function CapacitacionesTable({ capacitaciones, onEdit, onDelete, onViewParticipantes, canManage, selectedCapacitaciones, onSelect, onSelectAll }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {canManage && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCapacitaciones.length === capacitaciones.length}
                    onChange={onSelectAll}
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacitación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participantes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {capacitaciones.map((capacitacion) => (
              <CapacitacionTableRow
                key={capacitacion.id}
                capacitacion={capacitacion}
                onEdit={onEdit}
                onDelete={onDelete}
                onViewParticipantes={onViewParticipantes}
                canManage={canManage}
                isSelected={selectedCapacitaciones.includes(capacitacion.id)}
                onSelect={onSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CapacitacionTableRow({ capacitacion, onEdit, onDelete, onViewParticipantes, canManage, isSelected, onSelect }) {
  const totalParticipantes = capacitacion.participantes?.length || 0;
  const asistentes = capacitacion.participantes?.filter(p => p.asistio).length || 0;
  
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-red-50' : ''}`}>
      {canManage && (
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(capacitacion.id)}
          />
        </td>
      )}
      <td className="px-6 py-4">
        <div>
          <div className="text-sm font-medium text-gray-900">{capacitacion.nombre}</div>
          <div className="text-xs text-gray-500">{capacitacion.area}</div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(capacitacion.fecha).toLocaleDateString()}
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-gray-600">{capacitacion.modalidad}</span>
          {capacitacion.es_obligatorio && (
            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 w-fit">
              Obligatorio
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-gray-900">
        {totalParticipantes > 0 ? (
          <div>
            <div>{asistentes}/{totalParticipantes}</div>
            <div className="text-xs text-gray-500">
              {Math.round((asistentes / totalParticipantes) * 100)}% asistencia
            </div>
          </div>
        ) : (
          <span className="text-gray-400">Sin participantes</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {capacitacion.fecha_caducidad && new Date(capacitacion.fecha_caducidad) < new Date() ? (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            Caducada
          </span>
        ) : new Date(capacitacion.fecha) > new Date() ? (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
            Próxima
          </span>
        ) : (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Completada
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onViewParticipantes(capacitacion)}
            className="text-blue-600 hover:text-blue-900"
            title="Ver participantes"
          >
            👥
          </button>
          {canManage && (
            <>
              <button
                onClick={() => onEdit(capacitacion)}
                className="text-gray-600 hover:text-gray-900"
                title="Editar"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(capacitacion.id)}
                className="text-red-600 hover:text-red-900"
                title="Eliminar"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}