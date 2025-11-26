import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';
import apiClient from '../../../shared/utils/apiClient';

export default function Captura() {
  const [step, setStep] = useState('capture'); // capture, processing, result
  const [image, setImage] = useState(null);
  const [patente, setPatente] = useState('');
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gpsCoords, setGpsCoords] = useState(null);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Obtener ubicación GPS
  const getGPSLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error obteniendo GPS:', error);
        }
      );
    }
  };

  // Capturar desde cámara
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara');
    }
  };

  // Tomar foto
  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video && canvas) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        setImage(blob);
        processOCR(blob);
        
        // Detener cámara
        const stream = video.srcObject;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }, 'image/jpeg');
    }
  };

  // Subir desde archivo
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      processOCR(file);
    }
  };

  // Procesar OCR
  const processOCR = async (imageFile) => {
    setStep('processing');
    setLoading(true);
    setError('');
    getGPSLocation();

    try {
      const worker = await createWorker('spa');
      
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      });

      const { data: { text, confidence } } = await worker.recognize(imageFile);
      
      await worker.terminate();

      // Extraer patente del texto
      const extractedPatente = extractPatente(text);
      
      if (extractedPatente) {
        setPatente(extractedPatente);
        setOcrConfidence(confidence);
      } else {
        setError('No se pudo detectar una patente válida. Por favor ingrese manualmente.');
      }
      
      setStep('result');
    } catch (err) {
      setError('Error procesando OCR: ' + err.message);
      setStep('capture');
    } finally {
      setLoading(false);
    }
  };

  // Extraer formato de patente
  const extractPatente = (text) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Formato viejo: ABC123
    const oldFormat = cleaned.match(/[A-Z]{3}\d{3}/);
    if (oldFormat) return oldFormat[0];
    
    // Formato nuevo: AB123CD
    const newFormat = cleaned.match(/[A-Z]{2}\d{3}[A-Z]{2}/);
    if (newFormat) return newFormat[0];
    
    return null;
  };

  // Consultar vehículo
  const consultarVehiculo = async () => {
    if (!patente) {
      setError('Ingrese una patente válida');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/carinfo/consultar', {
        patente,
        gps_lat: gpsCoords?.lat,
        gps_lon: gpsCoords?.lon
      });

      setResultado(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Error consultando vehículo');
    } finally {
      setLoading(false);
    }
  };

  // Reiniciar
  const reset = () => {
    setStep('capture');
    setImage(null);
    setPatente('');
    setResultado(null);
    setError('');
    setOcrConfidence(0);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {step === 'capture' && (
        <CaptureStep
          onCameraCapture={handleCameraCapture}
          onFileUpload={handleFileUpload}
          videoRef={videoRef}
          canvasRef={canvasRef}
          onTakePhoto={takePhoto}
          fileInputRef={fileInputRef}
        />
      )}

      {step === 'processing' && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Procesando imagen con OCR...</p>
        </div>
      )}

      {step === 'result' && !resultado && (
        <ResultStep
          patente={patente}
          setPatente={setPatente}
          ocrConfidence={ocrConfidence}
          onConsultar={consultarVehiculo}
          onReset={reset}
          loading={loading}
          error={error}
        />
      )}

      {resultado && (
        <VehicleResult resultado={resultado} onReset={reset} />
      )}
    </div>
  );
}

function CaptureStep({ onCameraCapture, onFileUpload, videoRef, canvasRef, onTakePhoto, fileInputRef }) {
  const [cameraActive, setCameraActive] = useState(false);

  const startCamera = () => {
    setCameraActive(true);
    onCameraCapture();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Capturar Patente</h2>

      {!cameraActive ? (
        <div className="space-y-4">
          <button
            onClick={startCamera}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition font-medium text-lg"
          >
            📷 Abrir Cámara
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O</span>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-lg hover:bg-gray-200 transition font-medium text-lg"
          >
            📁 Subir Imagen
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileUpload}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full" autoPlay playsInline />
          </div>
          
          <button
            onClick={onTakePhoto}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition font-medium text-lg"
          >
            📸 Tomar Foto
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function ResultStep({ patente, setPatente, ocrConfidence, onConsultar, onReset, loading, error }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Confirmar Patente</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Patente Detectada {ocrConfidence > 0 && `(Confianza: ${Math.round(ocrConfidence)}%)`}
        </label>
        <input
          type="text"
          value={patente}
          onChange={(e) => setPatente(e.target.value.toUpperCase())}
          className="w-full px-4 py-3 border border-gray-300 rounded-md text-2xl font-bold text-center uppercase"
          placeholder="ABC123"
          maxLength={7}
        />
        <p className="text-sm text-gray-500 mt-2 text-center">
          Formatos válidos: ABC123 o AB123CD
        </p>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={onReset}
          className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition font-medium"
        >
          Cancelar
        </button>
        <button
          onClick={onConsultar}
          disabled={loading || !patente}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
        >
          {loading ? 'Consultando...' : 'Consultar'}
        </button>
      </div>
    </div>
  );
}

function VehicleResult({ resultado, onReset }) {
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
    <div className="space-y-6">
      {/* Estado */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            Resultado de Consulta
          </h2>
          <span className={`px-4 py-2 rounded-full font-bold uppercase ${getEstadoBadge(resultado.estado_vehiculo)}`}>
            {resultado.estado_vehiculo}
          </span>
        </div>
      </div>

      {/* Datos del Vehículo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Datos del Vehículo</h3>
        <dl className="grid grid-cols-2 gap-4">
          <InfoItem label="Patente" value={resultado.vehiculo.patente} />
          <InfoItem label="Marca" value={resultado.vehiculo.marca} />
          <InfoItem label="Modelo" value={resultado.vehiculo.modelo} />
          <InfoItem label="Año" value={resultado.vehiculo.anio} />
          <InfoItem label="Color" value={resultado.vehiculo.color} />
          <InfoItem label="Tipo" value={resultado.vehiculo.tipo} />
        </dl>
      </div>

      {/* Datos del Titular */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Datos del Titular</h3>
        <dl className="grid grid-cols-2 gap-4">
          <InfoItem label="DNI" value={resultado.titular.dni} />
          <InfoItem label="Nombre" value={`${resultado.titular.nombre} ${resultado.titular.apellido}`} />
          <InfoItem label="Domicilio" value={resultado.titular.domicilio} className="col-span-2" />
        </dl>
      </div>

      {/* Acciones */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 text-gray-800">Acciones Disponibles</h3>
        <div className="space-y-3">
          {resultado.opciones.map((opcion) => (
            <button
              key={opcion}
              className="w-full bg-blue-100 text-blue-800 py-3 px-4 rounded-lg hover:bg-blue-200 transition text-left font-medium"
            >
              {formatOpcion(opcion)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition font-medium"
      >
        Nueva Consulta
      </button>
    </div>
  );
}

function InfoItem({ label, value, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-gray-900">{value}</dd>
    </div>
  );
}

function formatOpcion(opcion) {
  const opciones = {
    generar_acta: '📝 Generar Acta',
    registrar_intervencion: '📋 Registrar Intervención',
    dejar_circular: '✅ Dejar Circular',
    retener_documento: '⚠️ Retener Documento',
    secuestrar_vehiculo: '🚫 Secuestrar Vehículo',
    notificar_juzgado: '⚖️ Notificar Juzgado',
    detener_conductor: '🚨 Detener Conductor',
    notificar_urgente: '🚨 Notificación Urgente'
  };
  return opciones[opcion] || opcion;
}