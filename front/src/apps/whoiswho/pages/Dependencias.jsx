import { useState, useEffect } from 'react';
import apiClient from '../../../shared/utils/apiClient';

export default function Dependencias() {
  const [dependencias, setDependencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDependencias();
  }, []);

  const fetchDependencias = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/whoiswho/dependencias');
      setDependencias(response.data.data.dependencias);
    } catch (err) {
      setError('Error cargando dependencias');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dependencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Dependencias</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dependencias.map((dep) => (
            <div key={dep.id} className="border rounded-lg p-4 hover:shadow-lg transition">
              <h3 className="font-bold text-lg text-gray-800">{dep.nombre}</h3>
              <p className="text-sm text-gray-600 mb-2">{dep.tipo}</p>
              <p className="text-sm text-gray-700">{dep.direccion}</p>
              <p className="text-sm text-green-600 mt-2">{dep.telefono}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}