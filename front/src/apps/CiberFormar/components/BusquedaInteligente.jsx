import { useState, useEffect, useRef } from 'react';
import apiClient from '../../../shared/utils/apiClient';

export default function BusquedaInteligente({ onResultSelect, className = "" }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    loadRecentSearches();
    loadSuggestions();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const debounceTimer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setResults([]);
    }
  }, [query]);

  const loadRecentSearches = () => {
    const recent = JSON.parse(localStorage.getItem('capacitaciones_recent_searches') || '[]');
    setRecentSearches(recent.slice(0, 5));
  };

  const loadSuggestions = async () => {
    try {
      const response = await apiClient.get('/capacitaciones/suggestions');
      if (response.data.success) {
        setSuggestions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/capacitaciones/search', {
        params: { 
          q: query,
          intelligent: true,
          include_personal: true,
          include_concepts: true
        }
      });
      
      if (response.data.success) {
        setResults(response.data.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const saveRecentSearch = (searchQuery) => {
    const recent = JSON.parse(localStorage.getItem('capacitaciones_recent_searches') || '[]');
    const updated = [searchQuery, ...recent.filter(s => s !== searchQuery)].slice(0, 10);
    localStorage.setItem('capacitaciones_recent_searches', JSON.stringify(updated));
    setRecentSearches(updated.slice(0, 5));
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (e.target.value.length === 0) {
      setShowResults(false);
    }
  };

  const handleResultClick = (result) => {
    saveRecentSearch(query);
    setQuery('');
    setShowResults(false);
    if (onResultSelect) {
      onResultSelect(result);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowResults(true);
  };

  const handleRecentClick = (recentQuery) => {
    setQuery(recentQuery);
    setShowResults(true);
  };

  const highlightText = (text, searchQuery) => {
    if (!searchQuery) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const getSearchPlaceholder = () => {
    const placeholders = [
      "Buscar por nombre, concepto o tema...",
      "Ej: ciberseguridad, liderazgo, excel...",
      "Buscar capacitaciones, participantes...",
      "Ej: curso python, taller comunicación..."
    ];
    return placeholders[Math.floor(Math.random() * placeholders.length)];
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.length > 2 || recentSearches.length > 0 || suggestions.length > 0) {
              setShowResults(true);
            }
          }}
          placeholder={getSearchPlaceholder()}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
          </div>
        )}
      </div>

      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {/* Búsquedas recientes */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Búsquedas recientes
              </h4>
              <div className="space-y-1">
                {recentSearches.map((recent, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentClick(recent)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center space-x-2"
                  >
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{recent}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sugerencias */}
          {query.length === 0 && suggestions.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Sugerencias populares
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.slice(0, 8).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.term)}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-red-100 hover:text-red-700 transition-colors"
                  >
                    {suggestion.term} ({suggestion.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultados de búsqueda */}
          {query.length > 2 && (
            <div className="max-h-80 overflow-y-auto">
              {results.length > 0 ? (
                <div>
                  {/* Capacitaciones */}
                  {results.capacitaciones && results.capacitaciones.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        📚 Capacitaciones ({results.capacitaciones.length})
                      </h4>
                      <div className="space-y-2">
                        {results.capacitaciones.map((capacitacion) => (
                          <button
                            key={capacitacion.id}
                            onClick={() => handleResultClick({ type: 'capacitacion', data: capacitacion })}
                            className="w-full text-left p-3 hover:bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div 
                                  className="font-medium text-gray-900"
                                  dangerouslySetInnerHTML={{ 
                                    __html: highlightText(capacitacion.nombre, query) 
                                  }}
                                />
                                <div className="text-sm text-gray-500 mt-1">
                                  {new Date(capacitacion.fecha).toLocaleDateString()} • {capacitacion.modalidad}
                                  {capacitacion.area && ` • ${capacitacion.area}`}
                                </div>
                                {capacitacion.detalle && (
                                  <div 
                                    className="text-xs text-gray-600 mt-1 line-clamp-1"
                                    dangerouslySetInnerHTML={{ 
                                      __html: highlightText(capacitacion.detalle, query) 
                                    }}
                                  />
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                {capacitacion.es_obligatorio && (
                                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                    Obligatorio
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">
                                  {capacitacion.participantes_count || 0} part.
                                </span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Participantes/Personal */}
                  {results.personal && results.personal.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        👥 Personal ({results.personal.length})
                      </h4>
                      <div className="space-y-2">
                        {results.personal.map((person) => (
                          <button
                            key={person.id}
                            onClick={() => handleResultClick({ type: 'personal', data: person })}
                            className="w-full text-left p-3 hover:bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div 
                                  className="font-medium text-gray-900"
                                  dangerouslySetInnerHTML={{ 
                                    __html: highlightText(`${person.rango} ${person.nombre} ${person.apellido}`, query) 
                                  }}
                                />
                                <div className="text-sm text-gray-500">
                                  {person.area} • Legajo: {person.legajo}
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {person.capacitaciones_count || 0} capacitaciones
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Conceptos/Temas */}
                  {results.conceptos && results.conceptos.length > 0 && (
                    <div className="p-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        🔍 Conceptos relacionados ({results.conceptos.length})
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {results.conceptos.map((concepto, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(concepto.term)}
                            className="text-left p-2 hover:bg-gray-50 rounded text-sm"
                          >
                            <div className="font-medium text-gray-700">{concepto.term}</div>
                            <div className="text-xs text-gray-500">{concepto.count} resultados</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <div className="text-gray-500">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.042-5.291-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <p className="text-sm">No se encontraron resultados para "{query}"</p>
                    <p className="text-xs mt-1">Intenta con términos diferentes o más generales</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tips de búsqueda */}
          {query.length === 0 && (
            <div className="p-4 bg-gray-50 text-xs text-gray-600">
              <div className="font-medium mb-1">💡 Tips de búsqueda:</div>
              <ul className="space-y-1 text-xs">
                <li>• Busca por conceptos: "liderazgo", "excel", "python"</li>
                <li>• Usa nombres: "Juan Pérez", "María González"</li>
                <li>• Combina términos: "curso ciberseguridad virtual"</li>
                <li>• Prueba sinónimos: "capacitación", "formación", "curso"</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}