import { useState, useEffect } from 'react';
import apiClient from '../../../shared/utils/apiClient';


export default function ProtocoloModal({ protocolo, tipo, onClose }) {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    responsable: '',
    area: '',
    fecha_validez: '',
    clasificacion: '',
    autor: '',
    aprobado_por: '',
    tipo: tipo
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (protocolo) {
      setFormData({
        nombre: protocolo.nombre || '',
        descripcion: protocolo.descripcion || '',
        responsable: protocolo.responsable || '',
        area: protocolo.area || '',
        fecha_validez: protocolo.fecha_validez ? protocolo.fecha_validez.split('T')[0] : '',
        clasificacion: protocolo.clasificacion || '',
        autor: protocolo.autor || '',
        aprobado_por: protocolo.aprobado_por || '',
        tipo: protocolo.tipo || tipo
      });
    }
  }, [protocolo, tipo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });
      
      if (file) {
        data.append('documento', file);
      }

      if (protocolo) {
        await apiClient.put(`/protocolos/${protocolo.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await apiClient.post('/protocolos', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      onClose();
    } catch (error) {
      console.error('Error al guardar protocolo:', error);
      alert(error.response?.data?.error?.message || 'Error al guardar el protocolo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">
              {protocolo ? 'Editar Protocolo' : 'Nuevo Protocolo'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsable
              </label>
              <input
                type="text"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área
              </label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Validez
              </label>
              <input
                type="date"
                name="fecha_validez"
                value={formData.fecha_validez}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Clasificación
              </label>
              <select
                name="clasificacion"
                value={formData.clasificacion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Seleccionar...</option>
                <option value="Público">Público</option>
                <option value="Interno">Interno</option>
                <option value="Confidencial">Confidencial</option>
                <option value="Restringido">Restringido</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autor
              </label>
              <input
                type="text"
                name="autor"
                value={formData.autor}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aprobado por
              </label>
              <input
                type="text"
                name="aprobado_por"
                value={formData.aprobado_por}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Documento
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formatos permitidos: PDF, DOC, DOCX (máx. 10MB)
            </p>
            {protocolo?.documento_path && !file && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Documento actual: {protocolo.documento_path.split('/').pop()}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? 'Guardando...' : protocolo ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}