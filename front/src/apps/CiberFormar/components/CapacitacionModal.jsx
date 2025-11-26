import { useState, useEffect } from 'react';
import apiClient from '../../../shared/utils/apiClient';

export default function CapacitacionModal({ capacitacion, onClose }) {
  const [formData, setFormData] = useState({
    nombre: '',
    detalle: '',
    descripcion_completa: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    area: '',
    modalidad: '',
    es_obligatorio: false,
    fecha_caducidad: '',
    nivel_jerarquico: '',
    puestos_objetivo: '',
    tipo_formacion: 'curso_regular',
    instructor: '',
    ubicacion: '',
    capacidad_maxima: '',
    costo: '',
    observaciones: '',
    requisitos_previos: '',
    objetivos: '',
    metodologia: '',
    evaluacion: '',
    material_requerido: '',
    certificacion: false,
    horas_academicas: '',
    creditos: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [currentTab, setCurrentTab] = useState('basicos'); // basicos, detalles, configuracion

  useEffect(() => {
    if (capacitacion) {
      setFormData({
        nombre: capacitacion.nombre || '',
        detalle: capacitacion.detalle || '',
        descripcion_completa: capacitacion.descripcion_completa || '',
        fecha: capacitacion.fecha ? capacitacion.fecha.split('T')[0] : '',
        hora_inicio: capacitacion.hora_inicio || '',
        hora_fin: capacitacion.hora_fin || '',
        area: capacitacion.area || '',
        modalidad: capacitacion.modalidad || '',
        es_obligatorio: capacitacion.es_obligatorio || false,
        fecha_caducidad: capacitacion.fecha_caducidad ? capacitacion.fecha_caducidad.split('T')[0] : '',
        nivel_jerarquico: capacitacion.nivel_jerarquico || '',
        puestos_objetivo: capacitacion.puestos_objetivo || '',
        tipo_formacion: capacitacion.tipo_formacion || 'curso_regular',
        instructor: capacitacion.instructor || '',
        ubicacion: capacitacion.ubicacion || '',
        capacidad_maxima: capacitacion.capacidad_maxima || '',
        costo: capacitacion.costo || '',
        observaciones: capacitacion.observaciones || '',
        requisitos_previos: capacitacion.requisitos_previos || '',
        objetivos: capacitacion.objetivos || '',
        metodologia: capacitacion.metodologia || '',
        evaluacion: capacitacion.evaluacion || '',
        material_requerido: capacitacion.material_requerido || '',
        certificacion: capacitacion.certificacion || false,
        horas_academicas: capacitacion.horas_academicas || '',
        creditos: capacitacion.creditos || ''
      });
    }
  }, [capacitacion]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Limpiar error específico al cambiar el campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    }
    
    if (formData.capacidad_maxima && formData.capacidad_maxima < 1) {
      newErrors.capacidad_maxima = 'La capacidad debe ser mayor a 0';
    }
    
    if (formData.costo && formData.costo < 0) {
      newErrors.costo = 'El costo no puede ser negativo';
    }
    
    if (formData.horas_academicas && formData.horas_academicas < 0) {
      newErrors.horas_academicas = 'Las horas académicas no pueden ser negativas';
    }

    // Validación de fechas
    if (formData.fecha_caducidad && formData.fecha && 
        new Date(formData.fecha_caducidad) <= new Date(formData.fecha)) {
      newErrors.fecha_caducidad = 'La fecha de caducidad debe ser posterior a la fecha de la capacitación';
    }

    // Validación de horas
    if (formData.hora_inicio && formData.hora_fin && formData.hora_inicio >= formData.hora_fin) {
      newErrors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para envío
      const submitData = { ...formData };
      
      // Convertir strings vacíos a null para campos opcionales
      ['capacidad_maxima', 'costo', 'horas_academicas', 'creditos'].forEach(field => {
        if (submitData[field] === '') {
          submitData[field] = null;
        }
      });

      if (capacitacion) {
        await apiClient.put(`/capacitaciones/${capacitacion.id}`, submitData);
      } else {
        await apiClient.post('/capacitaciones', submitData);
      }

      onClose();
    } catch (error) {
      console.error('Error al guardar capacitación:', error);
      
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        alert(error.response?.data?.error?.message || 'Error al guardar la capacitación');
      }
    } finally {
      setLoading(false);
    }
  };

  const tiposFormacion = [
    { value: 'ciberseguridad', label: '🔐 Formación en Ciberseguridad', description: 'Capacitaciones específicas de seguridad informática' },
    { value: 'academia_mensual', label: '🎓 Academia Mensual', description: 'Sesiones regulares de formación continua' },
    { value: 'curso_regular', label: '📚 Curso Regular', description: 'Capacitación estándar o especializada' },
    { value: 'taller', label: '🔧 Taller Práctico', description: 'Sesión práctica y participativa' },
    { value: 'seminario', label: '🎤 Seminario', description: 'Presentación formal de conocimientos' },
    { value: 'webinar', label: '💻 Webinar', description: 'Capacitación virtual en línea' }
  ];

  const nivelesJerarquicos = [
    'Todos los niveles',
    'Oficial Superior',
    'Oficial Subalterno', 
    'Suboficial Superior',
    'Suboficial Subalterno',
    'Tropa'
  ];

  const tabs = [
    { id: 'basicos', label: 'Datos Básicos', icon: '📝' },
    { id: 'detalles', label: 'Detalles', icon: '📋' },
    { id: 'configuracion', label: 'Configuración', icon: '⚙️' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              {capacitacion ? 'Editar Capacitación' : 'Nueva Capacitación'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 mt-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  currentTab === tab.id
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Tab: Datos Básicos */}
          {currentTab === 'basicos' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Capacitación *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Formación *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tiposFormacion.map(tipo => (
                    <label key={tipo.value} className="flex items-start p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo_formacion"
                        value={tipo.value}
                        checked={formData.tipo_formacion === tipo.value}
                        onChange={handleChange}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-sm">{tipo.label}</div>
                        <div className="text-xs text-gray-500">{tipo.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción Breve
                </label>
                <textarea
                  name="detalle"
                  value={formData.detalle}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Descripción corta para listados..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.fecha ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.fecha && <p className="text-red-500 text-xs mt-1">{errors.fecha}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    name="hora_fin"
                    value={formData.hora_fin}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.hora_fin ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.hora_fin && <p className="text-red-500 text-xs mt-1">{errors.hora_fin}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modalidad
                  </label>
                  <select
                    name="modalidad"
                    value={formData.modalidad}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Híbrida">Híbrida</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    placeholder="Aula, plataforma virtual, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Área
                  </label>
                  <input
                    type="text"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Área organizativa"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor
                  </label>
                  <input
                    type="text"
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleChange}
                    placeholder="Nombre del instructor"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Detalles */}
          {currentTab === 'detalles' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción Completa
                </label>
                <textarea
                  name="descripcion_completa"
                  value={formData.descripcion_completa}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Descripción detallada del contenido, metodología y objetivos..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objetivos
                </label>
                <textarea
                  name="objetivos"
                  value={formData.objetivos}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Objetivos de aprendizaje que se buscan alcanzar..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metodología
                  </label>
                  <textarea
                    name="metodologia"
                    value={formData.metodologia}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Metodología de enseñanza a utilizar..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Evaluación
                  </label>
                  <textarea
                    name="evaluacion"
                    value={formData.evaluacion}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Criterios y métodos de evaluación..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material Requerido
                </label>
                <textarea
                  name="material_requerido"
                  value={formData.material_requerido}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Material que deben traer los participantes..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requisitos Previos
                </label>
                <textarea
                  name="requisitos_previos"
                  value={formData.requisitos_previos}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Conocimientos o capacitaciones previas necesarias..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <textarea
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Información adicional relevante..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          {/* Tab: Configuración */}
          {currentTab === 'configuracion' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirigida a
                </label>
                <select
                  name="nivel_jerarquico"
                  value={formData.nivel_jerarquico}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Seleccionar nivel jerárquico...</option>
                  {nivelesJerarquicos.map(nivel => (
                    <option key={nivel} value={nivel}>{nivel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puestos Objetivo
                </label>
                <input
                  type="text"
                  name="puestos_objetivo"
                  value={formData.puestos_objetivo}
                  onChange={handleChange}
                  placeholder="Puestos específicos (separados por coma)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Ej: Analista de Sistemas, Jefe de Seguridad, Operador de Red
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacidad Máxima
                  </label>
                  <input
                    type="number"
                    name="capacidad_maxima"
                    value={formData.capacidad_maxima}
                    onChange={handleChange}
                    min="1"
                    placeholder="Número"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.capacidad_maxima ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.capacidad_maxima && <p className="text-red-500 text-xs mt-1">{errors.capacidad_maxima}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horas Académicas
                  </label>
                  <input
                    type="number"
                    name="horas_academicas"
                    value={formData.horas_academicas}
                    onChange={handleChange}
                    min="0"
                    step="0.5"
                    placeholder="Ej: 8"
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors.horas_academicas ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.horas_academicas && <p className="text-red-500 text-xs mt-1">{errors.horas_academicas}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Créditos
                  </label>
                  <input
                    type="number"
                    name="creditos"
                    value={formData.creditos}
                    onChange={handleChange}
                    min="0"
                    step="0.1"
                    placeholder="Ej: 2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Costo
                </label>
                <input
                  type="number"
                  name="costo"
                  value={formData.costo}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.costo ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.costo && <p className="text-red-500 text-xs mt-1">{errors.costo}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Caducidad
                </label>
                <input
                  type="date"
                  name="fecha_caducidad"
                  value={formData.fecha_caducidad}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.fecha_caducidad ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.fecha_caducidad && <p className="text-red-500 text-xs mt-1">{errors.fecha_caducidad}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Fecha hasta la cual la capacitación mantiene su validez
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="es_obligatorio"
                    checked={formData.es_obligatorio}
                    onChange={handleChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Es obligatorio</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="certificacion"
                    checked={formData.certificacion}
                    onChange={handleChange}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Otorga certificación</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : capacitacion ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}