import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import apiClient from '@shared/utils/apiClient';

export default function Historial() {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchHistorial();
  }, [page]);

  const fetchHistorial = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.get(`/carinfo/historial?page=${page}&limit=10`);
      
      setConsultas(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError('Error cargando historial');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Historial de Consultas</h2>
          <p className="text-gray-600 mt-1">Registro de todas tus consultas vehiculares</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
            {error}
          </div>
        )}

        {consultas.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg">No hay consultas registradas</p>
          </div>
        ) : (
          <>
            <div className="divide-y">
              {consultas.map((consulta) => (
                <ConsultaItem key={consulta.id} consulta={consulta} />
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="p-4 flex justify-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-2">
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ConsultaItem({ consulta }) {
  const [expanded, setExpanded] = useState(false);

  const getEstadoBadge = (estado) => {
    const badges = {
      normal: 'bg-green-100 text-green-800',
      inhibido: 'bg-yellow-100 text-yellow-800',
      retenido: 'bg-orange-100 text-orange-800',
      robado: 'bg-red-100 text-red-800'
    };
    return badges[estado] || badges.normal;
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-bold text-gray-800">{consulta.patente}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoBadge(consulta.estado_vehiculo)}`}>
              {consulta.estado_vehiculo?.toUpperCase()}
            </span>
            {consulta.acta_generada && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                📝 Acta
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {format(new Date(consulta.timestamp), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es })}
          </p>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && consulta.resultado && (
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Marca/Modelo:</span>
            <p className="text-gray-900">{consulta.resultado.marca} {consulta.resultado.modelo}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Año:</span>
            <p className="text-gray-900">{consulta.resultado.anio}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Color:</span>
            <p className="text-gray-900">{consulta.resultado.color}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Tipo:</span>
            <p className="text-gray-900">{consulta.resultado.tipo}</p>
          </div>
          {consulta.accion_tomada && (
            <div className="col-span-2">
              <span className="font-medium text-gray-700">Acción:</span>
              <p className="text-gray-900">{consulta.accion_tomada}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}