import { useState, useEffect } from 'react';
import apiClient from '../../../shared/utils/apiClient';

export default function AsignacionMasivaModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: selección, 2: asignación, 3: confirmación
  const [loading, setLoading] = useState(false);
  const [personal, setPersonal] = useState([]);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [selectedCapacitacion, setSelectedCapacitacion] = useState('');
  const [asignationType, setAsignationType] = useState(''); // 'all', 'nivel', 'puesto', 'area', 'individual'
  const [filters, setFilters] = useState({
    nivel_jerarquico: '',
    puesto: '',
    area: '',
    individual_ids: []
  });
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [personalResponse, capacitacionesResponse] = await Promise.all([
        apiClient.get('/whoiswho/personal', { params: { limit: 1000 } }),
        apiClient.get('/capacitaciones', { params: { futuras: true } })
      ]);

      if (personalResponse.data.success) {
        setPersonal(personalResponse.data.data);
      }
      if (capacitacionesResponse.data.success) {
        setCapacitaciones(capacitacionesResponse.data.data);
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    if (!selectedCapacitacion || !asignationType) return;

    let filteredPersonal = [...personal];

    switch (asignationType) {
      case 'all':
        break; // No filtrar
      case 'nivel':
        filteredPersonal = personal.filter(p => p.nivel_jerarquico === filters.nivel_jerarquico);
        break;
      case 'puesto':
        filteredPersonal = personal.filter(p => p.puesto === filters.puesto);
        break;
      case 'area':
        filteredPersonal = personal.filter(p => p.area === filters.area);
        break;
      case 'individual':
        filteredPersonal = personal.filter(p => filters.individual_ids.includes(p.id));
        break;
      default:
        filteredPersonal = [];
    }

    setPreview(filteredPersonal);
  };

  useEffect(() => {
    generatePreview();
  }, [selectedCapacitacion, asignationType, filters]);

  const handleAsignacion = async () => {
    if (!selectedCapacitacion || preview.length === 0) return;

    try {
      setLoading(true);
      
      await apiClient.post(`/capacitaciones/${selectedCapacitacion}/asignacion-masiva`, {
        personal_ids: preview.map(p => p.id),
        tipo_asignacion: asignationType,
        filtros: filters
      });

      setStep(3);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error en asignación masiva:', error);
      alert(error.response?.data?.error?.message || 'Error en la asignación masiva');
    } finally {
      setLoading(false);
    }
  };

  const handleIndividualSelect = (personalId) => {
    setFilters(prev => ({
      ...prev,
      individual_ids: prev.individual_ids.includes(personalId)
        ? prev.individual_ids.filter(id => id !== personalId)
        : [...prev.individual_ids, personalId]
    }));
  };

  const handleSelectAllVisible = () => {
    const visibleIds = getFilteredPersonal().map(p => p.id);
    setFilters(prev => ({
      ...prev,
      individual_ids: [...new Set([...prev.individual_ids, ...visibleIds])]
    }));
  };

  const handleDeselectAllVisible = () => {
    const visibleIds = getFilteredPersonal().map(p => p.id);
    setFilters(prev => ({
      ...prev,
      individual_ids: prev.individual_ids.filter(id => !visibleIds.includes(id))
    }));
  };

  const getFilteredPersonal = () => {
    if (asignationType !== 'individual') return personal;
    
    return personal.filter(p => {
      if (!p.nombre && !p.apellido) return false;
      return true;
    });
  };

  // Opciones únicas
  const nivelesJerarquicos = [...new Set(personal.map(p => p.nivel_jerarquico).filter(Boolean))];
  const puestos = [...new Set(personal.map(p => p.puesto).filter(Boolean))];
  const areas = [...new Set(personal.map(p => p.area).filter(Boolean))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">Asignación Masiva de Capacitaciones</h3>
              <div className="flex items-center space-x-4 mt-2">
                <div className={`flex items-center ${step >= 1 ? 'text-red-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    step >= 1 ? 'border-red-600 bg-red-600 text-white' : 'border-gray-400'
                  }`}>1</div>
                  <span className="ml-2 text-sm">Selección</span>
                </div>
                <div className={`flex items-center ${step >= 2 ? 'text-red-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    step >= 2 ? 'border-red-600 bg-red-600 text-white' : 'border-gray-400'
                  }`}>2</div>
                  <span className="ml-2 text-sm">Confirmación</span>
                </div>
                <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                    step >= 3 ? 'border-green-600 bg-green-600 text-white' : 'border-gray-400'
                  }`}>3</div>
                  <span className="ml-2 text-sm">Completado</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Selección de capacitación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacitación a asignar *
                </label>
                <select
                  value={selectedCapacitacion}
                  onChange={(e) => setSelectedCapacitacion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  required
                >
                  <option value="">Seleccionar capacitación...</option>
                  {capacitaciones.map(cap => (
                    <option key={cap.id} value={cap.id}>
                      {cap.nombre} - {new Date(cap.fecha).toLocaleDateString()}
                      {cap.es_obligatorio && ' (Obligatorio)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de asignación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de asignación *
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="all"
                      checked={asignationType === 'all'}
                      onChange={(e) => setAsignationType(e.target.value)}
                      className="mr-2"
                    />
                    <span>Todo el personal</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="nivel"
                      checked={asignationType === 'nivel'}
                      onChange={(e) => setAsignationType(e.target.value)}
                      className="mr-2"
                    />
                    <span>Por nivel jerárquico</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="puesto"
                      checked={asignationType === 'puesto'}
                      onChange={(e) => setAsignationType(e.target.value)}
                      className="mr-2"
                    />
                    <span>Por puesto</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="area"
                      checked={asignationType === 'area'}
                      onChange={(e) => setAsignationType(e.target.value)}
                      className="mr-2"
                    />
                    <span>Por área</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="individual"
                      checked={asignationType === 'individual'}
                      onChange={(e) => setAsignationType(e.target.value)}
                      className="mr-2"
                    />
                    <span>Selección individual</span>
                  </label>
                </div>
              </div>

              {/* Filtros específicos */}
              {asignationType === 'nivel' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nivel jerárquico
                  </label>
                  <select
                    value={filters.nivel_jerarquico}
                    onChange={(e) => setFilters(prev => ({ ...prev, nivel_jerarquico: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Seleccionar nivel...</option>
                    {nivelesJerarquicos.map(nivel => (
                      <option key={nivel} value={nivel}>{nivel}</option>
                    ))}
                  </select>
                </div>
              )}

              {asignationType === 'puesto' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Puesto
                  </label>
                  <select
                    value={filters.puesto}
                    onChange={(e) => setFilters(prev => ({ ...prev, puesto: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Seleccionar puesto...</option>
                    {puestos.map(puesto => (
                      <option key={puesto} value={puesto}>{puesto}</option>
                    ))}
                  </select>
                </div>
              )}

              {asignationType === 'area' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Área
                  </label>
                  <select
                    value={filters.area}
                    onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Seleccionar área...</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
              )}

              {asignationType === 'individual' && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Seleccionar personal individualmente
                    </label>
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={handleSelectAllVisible}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        Seleccionar todos
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllVisible}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Deseleccionar todos
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                    {getFilteredPersonal().map(person => (
                      <label key={person.id} className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <input
                          type="checkbox"
                          checked={filters.individual_ids.includes(person.id)}
                          onChange={() => handleIndividualSelect(person.id)}
                          className="mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {person.rango} {person.nombre} {person.apellido}
                          </div>
                          <div className="text-xs text-gray-500">
                            {person.area} - {person.puesto} - Legajo: {person.legajo}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              {preview.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">
                    Vista previa: {preview.length} persona{preview.length !== 1 ? 's' : ''} seleccionada{preview.length !== 1 ? 's' : ''}
                  </h4>
                  <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
                    {preview.slice(0, 10).map(person => (
                      <div key={person.id}>
                        {person.rango} {person.nombre} {person.apellido} - {person.area}
                      </div>
                    ))}
                    {preview.length > 10 && (
                      <div className="text-gray-500 italic">
                        ... y {preview.length - 10} más
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="text-center py-8">
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">Procesando asignación masiva...</h4>
              <p className="text-gray-600">
                Asignando capacitación a {preview.length} persona{preview.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">¡Asignación completada!</h4>
              <p className="text-gray-600 mb-4">
                Se ha asignado la capacitación a {preview.length} persona{preview.length !== 1 ? 's' : ''} correctamente.
              </p>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  Los participantes recibirán notificaciones sobre la nueva capacitación asignada.
                </p>
              </div>
            </div>
          )}
        </div>

        {step === 1 && (
          <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setStep(2);
                handleAsignacion();
              }}
              disabled={!selectedCapacitacion || !asignationType || preview.length === 0 || loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Procesando...' : `Asignar a ${preview.length} persona${preview.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}