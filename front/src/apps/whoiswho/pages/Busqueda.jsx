import { useState, useEffect, useCallback } from 'react';
import apiClient from '@shared/utils/apiClient';
import { debounce } from '@shared/utils/helpers';

export default function Busqueda() {
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    area: '',
    rango: '',
    dependencia: ''
  });
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((filters) => {
      fetchPersonal(filters);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(filters);
  }, [filters]);

  const fetchPersonal = async (currentFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        ...currentFilters,
        page,
        limit: 20
      });

      const response = await apiClient.get(`/whoiswho/personal?${params}`);
      
      setPersonal(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (err) {
      setError('Error buscando personal');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const viewDetails = async (personId) => {
    try {
      const response = await apiClient.get(`/whoiswho/personal/${personId}`);
      setSelectedPerson(response.data.data.personal);
    } catch (err) {
      setError('Error obteniendo detalles');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
            <h3 className="text-lg font-bold mb-4">Filtros</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Nombre, apellido, legajo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área
                </label>
                <input
                  type="text"
                  value={filters.area}
                  onChange={(e) => handleFilterChange('area', e.target.value)}
                  placeholder="Ej: Investigaciones"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rango
                </label>
                <input
                  type="text"
                  value={filters.rango}
                  onChange={(e) => handleFilterChange('rango', e.target.value)}
                  placeholder="Ej: Comisario"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                onClick={() => setFilters({ search: '', area: '', rango: '', dependencia: '' })}
                className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Buscando...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          ) : personal.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">
              <p className="text-lg">No se encontraron resultados</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personal.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    onViewDetails={viewDetails}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex justify-center space-x-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="px-4 py-2">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPerson && (
        <PersonDetailModal
          person={selectedPerson}
          onClose={() => setSelectedPerson(null)}
        />
      )}
    </div>
  );
}

function PersonCard({ person, onViewDetails }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer"
         onClick={() => onViewDetails(person.id)}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-2xl font-bold text-green-600">
            {person.nombre[0]}{person.apellido[0]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {person.nombre} {person.apellido}
          </h3>
          <p className="text-sm text-gray-600">{person.rango}</p>
          <p className="text-sm text-gray-500">{person.cargo}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {person.area && (
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {person.area}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {person.telefono_directo && (
        <div className="mt-3 pt-3 border-t">
          <a
            href={`tel:${person.telefono_directo}`}
            className="text-sm text-green-600 hover:text-green-700"
            onClick={(e) => e.stopPropagation()}
          >
            {person.telefono_directo}
          </a>
        </div>
      )}
    </div>
  );
}

function PersonDetailModal({ person, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {person.nombre} {person.apellido}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Legajo" value={person.legajo} />
              <InfoField label="Rango" value={person.rango} />
              <InfoField label="Cargo" value={person.cargo} />
              <InfoField label="Área" value={person.area} />
              <InfoField label="Dependencia" value={person.dependencia} className="col-span-2" />
            </div>

            {person.telefono_directo && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Contacto</h3>
                <div className="space-y-2">
                  <a
                    href={`tel:${person.telefono_directo}`}
                    className="block bg-green-100 text-green-800 py-2 px-4 rounded-md hover:bg-green-200 transition text-center"
                  >
                    Llamar {person.telefono_directo}
                  </a>
                  {person.email_institucional && (
                    <a
                      href={`mailto:${person.email_institucional}`}
                      className="block bg-blue-100 text-blue-800 py-2 px-4 rounded-md hover:bg-blue-200 transition text-center"
                    >
                      {person.email_institucional}
                    </a>
                  )}
                </div>
              </div>
            )}

            {person.superior && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Superior Directo</h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="font-medium">{person.superior.nombre_completo}</p>
                  <p className="text-sm text-gray-600">{person.superior.cargo}</p>
                </div>
              </div>
            )}

            {person.subordinados && person.subordinados.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Subordinados</h3>
                <div className="space-y-2">
                  {person.subordinados.map((sub) => (
                    <div key={sub.id} className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">{sub.nombre_completo}</p>
                      <p className="text-sm text-gray-600">{sub.cargo}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-base font-semibold text-gray-900">{value || '-'}</dd>
    </div>
  );
}