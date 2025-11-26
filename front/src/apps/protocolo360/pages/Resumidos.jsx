import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import apiClient from '../../../shared/utils/apiClient';
import ProtocoloModal from '../components/ProtocoloModal';

export default function Resumidos() {
  const { hasPermission } = useAuth();
  const [protocolos, setProtocolos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedClasificacion, setSelectedClasificacion] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProtocolo, setSelectedProtocolo] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const canCreate = hasPermission('protocolos.crear');
  const canEdit = hasPermission('protocolos.editar');
  const canDelete = hasPermission('protocolos.eliminar');

  useEffect(() => {
    fetchProtocolos();
  }, [page, searchTerm, selectedArea, selectedClasificacion]);

  const fetchProtocolos = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        tipo: 'resumido',
        search: searchTerm || undefined,
        area: selectedArea || undefined,
        clasificacion: selectedClasificacion || undefined
      };
      
      const response = await apiClient.get('/protocolos', { params });
      
      if (response.data.success) {
        setProtocolos(response.data.data);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error('Error al cargar protocolos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (protocolo) => {
    try {
      const response = await apiClient.get(`/protocolos/${protocolo.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${protocolo.nombre}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error al descargar protocolo:', error);
      alert('Error al descargar el documento');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este protocolo?')) return;
    
    try {
      await apiClient.delete(`/protocolos/${id}`);
      fetchProtocolos();
    } catch (error) {
      console.error('Error al eliminar protocolo:', error);
      alert('Error al eliminar el protocolo');
    }
  };

  const handleOpenModal = (protocolo = null) => {
    setSelectedProtocolo(protocolo);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProtocolo(null);
    fetchProtocolos();
  };

  const areas = [...new Set(protocolos.map(p => p.area).filter(Boolean))];
  const clasificaciones = ['Público', 'Interno', 'Confidencial', 'Restringido'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Protocolos Resumidos</h2>
          <p className="text-gray-600 text-sm mt-1">Guías rápidas de procedimientos operativos</p>
        </div>
        {canCreate && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition font-medium"
          >
            + Nuevo Protocolo
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          
          <select
            value={selectedArea}
            onChange={(e) => {
              setSelectedArea(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todas las áreas</option>
            {areas.map(area => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
          
          <select
            value={selectedClasificacion}
            onChange={(e) => {
              setSelectedClasificacion(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Todas las clasificaciones</option>
            {clasificaciones.map(clasificacion => (
              <option key={clasificacion} value={clasificacion}>{clasificacion}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Cargando protocolos...</p>
        </div>
      ) : protocolos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No se encontraron protocolos</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Área
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clasificación
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {protocolos.map((protocolo) => (
                  <tr key={protocolo.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{protocolo.nombre}</div>
                      <div className="text-xs text-gray-500">
                        Creado: {new Date(protocolo.fecha_creacion).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {protocolo.descripcion || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {protocolo.area || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        protocolo.clasificacion === 'Público' ? 'bg-green-100 text-green-800' :
                        protocolo.clasificacion === 'Interno' ? 'bg-blue-100 text-blue-800' :
                        protocolo.clasificacion === 'Confidencial' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {protocolo.clasificacion || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {protocolo.documento_path && (
                        <button
                          onClick={() => handleDownload(protocolo)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Descargar"
                        >
                          📥
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleOpenModal(protocolo)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Editar"
                        >
                          ✏️
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(protocolo.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="text-gray-700">
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <ProtocoloModal
          protocolo={selectedProtocolo}
          tipo="resumido"
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}