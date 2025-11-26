import { useState } from 'react';
import apiClient from '../../../shared/utils/apiClient';

export default function ExportModal({ capacitaciones, filters, onClose }) {
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel'); // 'excel', 'pdf', 'csv'
  const [exportType, setExportType] = useState('filtered'); // 'all', 'filtered', 'selected'
  const [includeParticipantes, setIncludeParticipantes] = useState(true);
  const [includeEstadisticas, setIncludeEstadisticas] = useState(true);
  const [includeHistorial, setIncludeHistorial] = useState(false);
  const [selectedCapacitaciones, setSelectedCapacitaciones] = useState([]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const handleExport = async () => {
    try {
      setLoading(true);

      const exportParams = {
        formato: exportFormat,
        tipo: exportType,
        incluir_participantes: includeParticipantes,
        incluir_estadisticas: includeEstadisticas,
        incluir_historial: includeHistorial,
        ...filters
      };

      if (exportType === 'selected') {
        exportParams.capacitacion_ids = selectedCapacitaciones;
      }

      if (fechaDesde) exportParams.fecha_desde = fechaDesde;
      if (fechaHasta) exportParams.fecha_hasta = fechaHasta;

      const response = await apiClient.get('/capacitaciones/export', {
        params: exportParams,
        responseType: 'blob'
      });

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const extension = exportFormat === 'excel' ? 'xlsx' : exportFormat === 'pdf' ? 'pdf' : 'csv';
      
      link.setAttribute('download', `capacitaciones_${timestamp}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error('Error al exportar:', error);
      alert(error.response?.data?.error?.message || 'Error al exportar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCapacitacionSelect = (capacitacionId) => {
    setSelectedCapacitaciones(prev => {
      if (prev.includes(capacitacionId)) {
        return prev.filter(id => id !== capacitacionId);
      }
      return [...prev, capacitacionId];
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedCapacitaciones(capacitaciones.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedCapacitaciones([]);
  };

  const getExportPreview = () => {
    let count = 0;
    switch (exportType) {
      case 'all':
        count = capacitaciones.length;
        break;
      case 'filtered':
        count = capacitaciones.length;
        break;
      case 'selected':
        count = selectedCapacitaciones.length;
        break;
    }
    return count;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">Exportar Capacitaciones</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Formato de exportación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Formato de exportación
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value="excel"
                  checked={exportFormat === 'excel'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">📊 Excel (.xlsx)</div>
                  <div className="text-sm text-gray-500">
                    Formato completo con múltiples hojas y formato avanzado
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value="pdf"
                  checked={exportFormat === 'pdf'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">📋 PDF</div>
                  <div className="text-sm text-gray-500">
                    Reporte formateado para impresión y presentación
                  </div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  value="csv"
                  checked={exportFormat === 'csv'}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium text-gray-900">📄 CSV</div>
                  <div className="text-sm text-gray-500">
                    Datos básicos separados por comas para análisis
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Tipo de exportación */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Datos a exportar
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="filtered"
                  checked={exportType === 'filtered'}
                  onChange={(e) => setExportType(e.target.value)}
                  className="mr-2"
                />
                <span>Capacitaciones filtradas actuales ({capacitaciones.length})</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  value="selected"
                  checked={exportType === 'selected'}
                  onChange={(e) => setExportType(e.target.value)}
                  className="mr-2"
                />
                <span>Capacitaciones seleccionadas ({selectedCapacitaciones.length})</span>
              </label>
            </div>
          </div>

          {/* Selección específica */}
          {exportType === 'selected' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Seleccionar capacitaciones específicas
                </label>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Seleccionar todas las filtradas
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Deseleccionar todas
                  </button>
                </div>
              </div>
              
              <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                {capacitaciones.map(capacitacion => (
                  <label key={capacitacion.id} className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                    <input
                      type="checkbox"
                      checked={selectedCapacitaciones.includes(capacitacion.id)}
                      onChange={() => handleCapacitacionSelect(capacitacion.id)}
                      className="mr-3"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {capacitacion.nombre}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(capacitacion.fecha).toLocaleDateString()} - {capacitacion.area}
                        {capacitacion.es_obligatorio && ' (Obligatorio)'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Filtros de fecha adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtros de fecha adicionales (opcional)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Opciones de contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Contenido a incluir
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeParticipantes}
                  onChange={(e) => setIncludeParticipantes(e.target.checked)}
                  className="mr-2"
                />
                <span>Lista de participantes y estado de cada uno</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeEstadisticas}
                  onChange={(e) => setIncludeEstadisticas(e.target.checked)}
                  className="mr-2"
                />
                <span>Estadísticas de asistencia y aprobación</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeHistorial}
                  onChange={(e) => setIncludeHistorial(e.target.checked)}
                  className="mr-2"
                />
                <span>Historial de cambios y comentarios</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Vista previa de exportación</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>📊 Formato: <span className="font-medium">{exportFormat.toUpperCase()}</span></div>
              <div>📈 Capacitaciones: <span className="font-medium">{getExportPreview()}</span></div>
              <div>👥 Incluye participantes: <span className="font-medium">{includeParticipantes ? 'Sí' : 'No'}</span></div>
              <div>📊 Incluye estadísticas: <span className="font-medium">{includeEstadisticas ? 'Sí' : 'No'}</span></div>
              <div>📝 Incluye historial: <span className="font-medium">{includeHistorial ? 'Sí' : 'No'}</span></div>
              {(fechaDesde || fechaHasta) && (
                <div>📅 Rango de fechas: <span className="font-medium">
                  {fechaDesde || 'Sin límite'} - {fechaHasta || 'Sin límite'}
                </span></div>
              )}
            </div>
          </div>

          {/* Formatos especiales info */}
          {exportFormat === 'excel' && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-1">📊 Exportación Excel</h5>
              <div className="text-sm text-blue-700">
                Incluirá múltiples hojas: Capacitaciones, Participantes, Estadísticas y Dashboard de resumen.
              </div>
            </div>
          )}

          {exportFormat === 'pdf' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium text-green-800 mb-1">📋 Exportación PDF</h5>
              <div className="text-sm text-green-700">
                Reporte ejecutivo formateado con gráficos, tablas y resumen estadístico.
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={loading || (exportType === 'selected' && selectedCapacitaciones.length === 0)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Exportando...' : `Exportar ${getExportPreview()} capacitaciones`}
          </button>
        </div>
      </div>
    </div>
  );
}