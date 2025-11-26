import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import apiClient from '../../../shared/utils/apiClient';


export default function MisCapacitaciones() {
  const { user } = useAuth();
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.personal_id) {
      fetchMisCapacitaciones();
    }
  }, [user]);

  const fetchMisCapacitaciones = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/capacitaciones/personal/${user.personal_id}`);
      
      if (response.data.success) {
        setCapacitaciones(response.data.data);
      }
    } catch (error) {
      console.error('Error al cargar mis capacitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Mis Capacitaciones</h2>
        <p className="text-gray-600 text-sm mt-1">
          Historial de cursos y formaciones completadas
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="mt-4 text-gray-600">Cargando capacitaciones...</p>
        </div>
      ) : capacitaciones.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 text-lg">No tienes capacitaciones registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capacitaciones.map((participacion) => (
            <CapacitacionCard key={participacion.id} participacion={participacion} />
          ))}
        </div>
      )}
    </div>
  );
}

function CapacitacionCard({ participacion }) {
  const capacitacion = participacion.capacitacion;

  if (!capacitacion) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-800">{capacitacion.nombre}</h3>
        {participacion.aprobado && (
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            ✓ Aprobado
          </span>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {capacitacion.detalle || 'Sin descripción'}
      </p>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Fecha:</span>
          <span className="font-medium">
            {new Date(capacitacion.fecha).toLocaleDateString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Modalidad:</span>
          <span className="font-medium">{capacitacion.modalidad || '-'}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Área:</span>
          <span className="font-medium">{capacitacion.area || '-'}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Asistencia:</span>
          <span className={`font-medium ${participacion.asistio ? 'text-green-600' : 'text-red-600'}`}>
            {participacion.asistio ? 'Presente' : 'Ausente'}
          </span>
        </div>

        {participacion.firma_path && (
          <div className="flex justify-between">
            <span className="text-gray-500">Firma:</span>
            <span className="text-green-600">✓ Firmado</span>
          </div>
        )}

        {capacitacion.fecha_caducidad && (
          <div className="flex justify-between">
            <span className="text-gray-500">Caduca:</span>
            <span className="font-medium text-orange-600">
              {new Date(capacitacion.fecha_caducidad).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {participacion.observaciones && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">Observaciones:</p>
          <p className="text-sm text-gray-700 mt-1">{participacion.observaciones}</p>
        </div>
      )}
    </div>
  );
}