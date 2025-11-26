import { useState, useEffect } from 'react';
import apiClient from '../../../shared/utils/apiClient';

export default function ParticipantesModal({ capacitacion, onClose }) {
  const [participantes, setParticipantes] = useState([]);
  const [allPersonal, setAllPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedPersonal, setSelectedPersonal] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsistencia, setFilterAsistencia] = useState(''); // todos, asistio, no_asistio
  const [filterAprobacion, setFilterAprobacion] = useState(''); // todos, aprobado, no_aprobado
  const [selectedParticipantes, setSelectedParticipantes] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // table, cards

  useEffect(() => {
    if (capacitacion) {
      fetchParticipantes();
      fetchAllPersonal();
    }
  }, [capacitacion]);

  const fetchParticipantes = async () => {
    try {
      const response = await apiClient.get(`/capacitaciones/${capacitacion.id}`);
      if (response.data.success) {
        setParticipantes(response.data.data.participantes || []);
      }
    } catch (error) {
      console.error('Error al cargar participantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPersonal = async () => {
    try {
      const response = await apiClient.get('/whoiswho/personal', {
        params: { limit: 1000 }
      });
      if (response.data.success) {
        setAllPersonal(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar personal:', error);
    }
  };

  const handleAddParticipante = async () => {
    if (!selectedPersonal) return;

    try {
      await apiClient.post(`/capacitaciones/${capacitacion.id}/participantes`, {
        personal_id: selectedPersonal
      });
      setShowAddModal(false);
      setSelectedPersonal('');
      fetchParticipantes();
    } catch (error) {
      console.error('Error al agregar participante:', error);
      alert(error.response?.data?.error?.message || 'Error al agregar participante');
    }
  };

  const handleBulkAdd = async (personalIds) => {
    try {
      await apiClient.post(`/capacitaciones/${capacitacion.id}/participantes/bulk`, {
        personal_ids: personalIds
      });
      setShowBulkModal(false);
      fetchParticipantes();
    } catch (error) {
      console.error('Error en asignación masiva:', error);
      alert(error.response?.data?.error?.message || 'Error en la asignación masiva');
    }
  };

  const handleUpdateParticipante = async (participanteId, updates) => {
    try {
      const formData = new FormData();
      Object.keys(updates).forEach(key => {
        formData.append(key, updates[key]);
      });

      await apiClient.put(`/capacitaciones/${capacitacion.id}/participantes/${participanteId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchParticipantes();
    } catch (error) {
      console.error('Error al actualizar participante:', error);
      alert('Error al actualizar participante');
    }
  };

  const handleDeleteParticipante = async (participanteId) => {
    if (!confirm('¿Estás seguro de eliminar este participante?')) return;

    try {
      await apiClient.delete(`/capacitaciones/${capacitacion.id}/participantes/${participanteId}`);
      fetchParticipantes();
    } catch (error) {
      console.error('Error al eliminar participante:', error);
      alert('Error al eliminar participante');
    }
  };

  const handleFileUpload = async (participanteId, file) => {
    const formData = new FormData();
    formData.append('firma', file);

    try {
      await apiClient.put(`/capacitaciones/${capacitacion.id}/participantes/${participanteId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchParticipantes();
    } catch (error) {
      console.error('Error al subir firma:', error);
      alert('Error al subir la firma');
    }
  };

  const handleParticipanteSelect = (participanteId) => {
    setSelectedParticipantes(prev => {
      if (prev.includes(participanteId)) {
        return prev.filter(id => id !== participanteId);
      }
      return [...prev, participanteId];
    });
  };

  const handleSelectAll = () => {
    const filtered = getFilteredParticipantes();
    if (selectedParticipantes.length === filtered.length) {
      setSelectedParticipantes([]);
    } else {
      setSelectedParticipantes(filtered.map(p => p.id));
    }
  };

  const handleBulkUpdate = async (updates) => {
    try {
      await apiClient.put(`/capacitaciones/${capacitacion.id}/participantes/bulk`, {
        participante_ids: selectedParticipantes,
        updates
      });
      setSelectedParticipantes([]);
      fetchParticipantes();
    } catch (error) {
      console.error('Error en actualización masiva:', error);
      alert('Error en la actualización masiva');
    }
  };

  const handleExportParticipantes = async () => {
    try {
      const response = await apiClient.get(`/capacitaciones/${capacitacion.id}/participantes/export`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `participantes_${capacitacion.nombre}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al exportar participantes');
    }
  };

  const getFilteredParticipantes = () => {
    return participantes.filter(participante => {
      // Filtro de búsqueda
      if (searchTerm) {
        const personal = participante.personal;
        const searchLower = searchTerm.toLowerCase();
        if (!personal || (
          !personal.nombre?.toLowerCase().includes(searchLower) &&
          !personal.apellido?.toLowerCase().includes(searchLower) &&
          !personal.legajo?.toLowerCase().includes(searchLower) &&
          !personal.area?.toLowerCase().includes(searchLower)
        )) {
          return false;
        }
      }

      // Filtro de asistencia
      if (filterAsistencia === 'asistio' && !participante.asistio) return false;
      if (filterAsistencia === 'no_asistio' && participante.asistio) return false;

      // Filtro de aprobación
      if (filterAprobacion === 'aprobado' && !participante.aprobado) return false;
      if (filterAprobacion === 'no_aprobado' && participante.aprobado) return false;

      return true;
    });
  };

  const availablePersonal = allPersonal.filter(
    person => !participantes.some(p => p.personal_id === person.id)
  );

  const filteredParticipantes = getFilteredParticipantes();
  
  // Estadísticas
  const stats = {
    total: participantes.length,
    asistieron: participantes.filter(p => p.asistio).length,
    aprobados: participantes.filter(p => p.aprobado).length,
    firmaron: participantes.filter(p => p.firma_path).length
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                Participantes - {capacitacion.nombre}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(capacitacion.fecha).toLocaleDateString()} - {capacitacion.modalidad}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExportParticipantes}
                className="bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition text-sm font-medium"
              >
                📊 Exportar
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition text-sm font-medium"
              >
                👥 Agregar Múltiples
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition text-sm font-medium"
              >
                + Agregar Participante
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {stats.asistieron} ({stats.total > 0 ? Math.round((stats.asistieron / stats.total) * 100) : 0}%)
              </div>
              <div className="text-xs text-gray-500">Asistieron</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {stats.aprobados} ({stats.total > 0 ? Math.round((stats.aprobados / stats.total) * 100) : 0}%)
              </div>
              <div className="text-xs text-gray-500">Aprobados</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {stats.firmaron} ({stats.total > 0 ? Math.round((stats.firmaron / stats.total) * 100) : 0}%)
              </div>
              <div className="text-xs text-gray-500">Firmaron</div>
            </div>
          </div>

          {/* Filtros y búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar participante..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div>
              <select
                value={filterAsistencia}
                onChange={(e) => setFilterAsistencia(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todos (Asistencia)</option>
                <option value="asistio">Solo asistieron</option>
                <option value="no_asistio">No asistieron</option>
              </select>
            </div>

            <div>
              <select
                value={filterAprobacion}
                onChange={(e) => setFilterAprobacion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Todos (Aprobación)</option>
                <option value="aprobado">Solo aprobados</option>
                <option value="no_aprobado">No aprobados</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded text-sm ${viewMode === 'table' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                📋 Tabla
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded text-sm ${viewMode === 'cards' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                🃏 Tarjetas
              </button>
            </div>
          </div>

          {selectedParticipantes.length > 0 && (
            <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg">
              <span className="text-sm text-red-700 font-medium">
                {selectedParticipantes.length} participante{selectedParticipantes.length !== 1 ? 's' : ''} seleccionado{selectedParticipantes.length !== 1 ? 's' : ''}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkUpdate({ asistio: true })}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  ✓ Marcar asistencia
                </button>
                <button
                  onClick={() => handleBulkUpdate({ aprobado: true })}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  🎓 Marcar aprobados
                </button>
                <button
                  onClick={() => setSelectedParticipantes([])}
                  className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  Deseleccionar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              <p className="mt-4 text-gray-600">Cargando participantes...</p>
            </div>
          ) : filteredParticipantes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {participantes.length === 0 ? 'No hay participantes registrados' : 'No se encontraron participantes con los filtros aplicados'}
              </p>
              {participantes.length === 0 && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-red-600 hover:text-red-700 font-medium"
                >
                  Agregar el primer participante
                </button>
              )}
            </div>
          ) : viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedParticipantes.length === filteredParticipantes.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Personal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inscripción
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asistió
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aprobado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Firma
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Observaciones
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParticipantes.map((participante) => (
                    <ParticipanteTableRow
                      key={participante.id}
                      participante={participante}
                      onUpdate={handleUpdateParticipante}
                      onDelete={handleDeleteParticipante}
                      onFileUpload={handleFileUpload}
                      isSelected={selectedParticipantes.includes(participante.id)}
                      onSelect={handleParticipanteSelect}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredParticipantes.map((participante) => (
                <ParticipanteCard
                  key={participante.id}
                  participante={participante}
                  onUpdate={handleUpdateParticipante}
                  onDelete={handleDeleteParticipante}
                  onFileUpload={handleFileUpload}
                  isSelected={selectedParticipantes.includes(participante.id)}
                  onSelect={handleParticipanteSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Add Single Participante Modal */}
        {showAddModal && (
          <AddParticipanteModal
            availablePersonal={availablePersonal}
            selectedPersonal={selectedPersonal}
            setSelectedPersonal={setSelectedPersonal}
            onAdd={handleAddParticipante}
            onClose={() => {
              setShowAddModal(false);
              setSelectedPersonal('');
            }}
          />
        )}

        {/* Bulk Add Modal */}
        {showBulkModal && (
          <BulkAddModal
            availablePersonal={availablePersonal}
            onAdd={handleBulkAdd}
            onClose={() => setShowBulkModal(false)}
          />
        )}
      </div>
    </div>
  );
}

function ParticipanteTableRow({ participante, onUpdate, onDelete, onFileUpload, isSelected, onSelect }) {
  const [editing, setEditing] = useState(false);
  const [observaciones, setObservaciones] = useState(participante.observaciones || '');

  const handleToggle = (field) => {
    onUpdate(participante.id, { [field]: !participante[field] });
  };

  const handleSaveObservaciones = () => {
    onUpdate(participante.id, { observaciones });
    setEditing(false);
  };

  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? 'bg-red-50' : ''}`}>
      <td className="px-6 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(participante.id)}
        />
      </td>
      <td className="px-6 py-4">
        {participante.personal ? (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {participante.personal.rango} {participante.personal.nombre} {participante.personal.apellido}
            </div>
            <div className="text-xs text-gray-500">
              {participante.personal.area} - Legajo: {participante.personal.legajo}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Personal eliminado</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(participante.fecha_inscripcion).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => handleToggle('asistio')}
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            participante.asistio
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {participante.asistio ? '✓ Sí' : '✗ No'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => handleToggle('aprobado')}
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            participante.aprobado
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {participante.aprobado ? '✓ Aprobado' : '✗ No aprobado'}
        </button>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {participante.firma_path ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-green-600">✓ Firmado</span>
            <label className="cursor-pointer text-blue-600 hover:text-blue-900 text-xs">
              Cambiar
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    onFileUpload(participante.id, e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        ) : (
          <label className="cursor-pointer text-blue-600 hover:text-blue-900 text-sm">
            Subir firma
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files[0]) {
                  onFileUpload(participante.id, e.target.files[0]);
                }
              }}
            />
          </label>
        )}
      </td>
      <td className="px-6 py-4">
        {editing ? (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Observaciones..."
            />
            <button
              onClick={handleSaveObservaciones}
              className="text-green-600 hover:text-green-900"
            >
              ✓
            </button>
            <button
              onClick={() => {
                setObservaciones(participante.observaciones || '');
                setEditing(false);
              }}
              className="text-red-600 hover:text-red-900"
            >
              ✗
            </button>
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
          >
            {participante.observaciones || 'Sin observaciones...'}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onDelete(participante.id)}
          className="text-red-600 hover:text-red-900"
          title="Eliminar"
        >
          🗑️
        </button>
      </td>
    </tr>
  );
}

function ParticipanteCard({ participante, onUpdate, onDelete, onFileUpload, isSelected, onSelect }) {
  const [editing, setEditing] = useState(false);
  const [observaciones, setObservaciones] = useState(participante.observaciones || '');

  const handleToggle = (field) => {
    onUpdate(participante.id, { [field]: !participante[field] });
  };

  const handleSaveObservaciones = () => {
    onUpdate(participante.id, { observaciones });
    setEditing(false);
  };

  return (
    <div className={`bg-white border-2 rounded-lg p-4 hover:shadow-md transition ${
      isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(participante.id)}
          className="mt-1"
        />
        <button
          onClick={() => onDelete(participante.id)}
          className="text-red-600 hover:text-red-900"
          title="Eliminar"
        >
          🗑️
        </button>
      </div>

      {participante.personal ? (
        <div className="mb-3">
          <div className="font-medium text-gray-900">
            {participante.personal.rango} {participante.personal.nombre} {participante.personal.apellido}
          </div>
          <div className="text-sm text-gray-500">
            {participante.personal.area}
          </div>
          <div className="text-xs text-gray-400">
            Legajo: {participante.personal.legajo}
          </div>
        </div>
      ) : (
        <div className="mb-3 text-sm text-gray-500">Personal eliminado</div>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span>Inscripción:</span>
          <span>{new Date(participante.fecha_inscripcion).toLocaleDateString()}</span>
        </div>

        <div className="flex justify-between items-center">
          <span>Asistió:</span>
          <button
            onClick={() => handleToggle('asistio')}
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              participante.asistio
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {participante.asistio ? '✓ Sí' : '✗ No'}
          </button>
        </div>

        <div className="flex justify-between items-center">
          <span>Aprobado:</span>
          <button
            onClick={() => handleToggle('aprobado')}
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              participante.aprobado
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {participante.aprobado ? '✓ Sí' : '✗ No'}
          </button>
        </div>

        <div className="flex justify-between items-center">
          <span>Firma:</span>
          {participante.firma_path ? (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-green-600">✓</span>
              <label className="cursor-pointer text-blue-600 hover:text-blue-900 text-xs">
                Cambiar
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      onFileUpload(participante.id, e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          ) : (
            <label className="cursor-pointer text-blue-600 hover:text-blue-900 text-xs">
              Subir
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    onFileUpload(participante.id, e.target.files[0]);
                  }
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Observaciones
        </label>
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={2}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              placeholder="Observaciones..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSaveObservaciones}
                className="text-green-600 hover:text-green-900 text-sm"
              >
                ✓ Guardar
              </button>
              <button
                onClick={() => {
                  setObservaciones(participante.observaciones || '');
                  setEditing(false);
                }}
                className="text-red-600 hover:text-red-900 text-sm"
              >
                ✗ Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditing(true)}
            className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded min-h-[1.5rem]"
          >
            {participante.observaciones || 'Hacer clic para agregar observaciones...'}
          </div>
        )}
      </div>
    </div>
  );
}

function AddParticipanteModal({ availablePersonal, selectedPersonal, setSelectedPersonal, onAdd, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Agregar Participante</h4>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Personal
          </label>
          <select
            value={selectedPersonal}
            onChange={(e) => setSelectedPersonal(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Seleccionar...</option>
            {availablePersonal.map(person => (
              <option key={person.id} value={person.id}>
                {person.rango} {person.nombre} {person.apellido} - {person.area}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onAdd}
            disabled={!selectedPersonal}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkAddModal({ availablePersonal, onAdd, onClose }) {
  const [selectedPersonal, setSelectedPersonal] = useState([]);
  const [filters, setFilters] = useState({
    area: '',
    nivel_jerarquico: '',
    search: ''
  });

  const handlePersonalSelect = (personalId) => {
    setSelectedPersonal(prev => {
      if (prev.includes(personalId)) {
        return prev.filter(id => id !== personalId);
      }
      return [...prev, personalId];
    });
  };

  const handleSelectAllFiltered = () => {
    const filtered = getFilteredPersonal();
    const filteredIds = filtered.map(p => p.id);
    setSelectedPersonal(prev => [...new Set([...prev, ...filteredIds])]);
  };

  const handleDeselectAll = () => {
    setSelectedPersonal([]);
  };

  const getFilteredPersonal = () => {
    return availablePersonal.filter(person => {
      if (filters.search && 
          !person.nombre?.toLowerCase().includes(filters.search.toLowerCase()) &&
          !person.apellido?.toLowerCase().includes(filters.search.toLowerCase()) &&
          !person.legajo?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.area && person.area !== filters.area) return false;
      if (filters.nivel_jerarquico && person.nivel_jerarquico !== filters.nivel_jerarquico) return false;
      return true;
    });
  };

  const areas = [...new Set(availablePersonal.map(p => p.area).filter(Boolean))];
  const nivelesJerarquicos = [...new Set(availablePersonal.map(p => p.nivel_jerarquico).filter(Boolean))];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Agregar Múltiples Participantes</h4>
        
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Buscar personal..."
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <select
            value={filters.area}
            onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todas las áreas</option>
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          <select
            value={filters.nivel_jerarquico}
            onChange={(e) => setFilters(prev => ({ ...prev, nivel_jerarquico: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Todos los niveles</option>
            {nivelesJerarquicos.map(nivel => (
              <option key={nivel} value={nivel}>{nivel}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-600">
            {selectedPersonal.length} de {getFilteredPersonal().length} seleccionados
          </span>
          <div className="space-x-2">
            <button
              onClick={handleSelectAllFiltered}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Seleccionar filtrados
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Deseleccionar todos
            </button>
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md mb-4">
          {getFilteredPersonal().map(person => (
            <label key={person.id} className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
              <input
                type="checkbox"
                checked={selectedPersonal.includes(person.id)}
                onChange={() => handlePersonalSelect(person.id)}
                className="mr-3"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {person.rango} {person.nombre} {person.apellido}
                </div>
                <div className="text-xs text-gray-500">
                  {person.area} - Legajo: {person.legajo}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onAdd(selectedPersonal)}
            disabled={selectedPersonal.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
          >
            Agregar {selectedPersonal.length} participante{selectedPersonal.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}