import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validación básica
    if (!email) {
      setError('Por favor ingresa tu correo electrónico');
      setLoading(false);
      return;
    }

    // Simular envío de correo (aquí iría tu lógica real)
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-police-blue to-police-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8 text-center">
          <div className="inline-block bg-green-100 p-4 rounded-full mb-4">
            <svg className="w-16 h-16 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Correo Enviado!
          </h2>
          <p className="text-gray-600 mb-4">
            Hemos enviado las instrucciones para restablecer tu contraseña a:
          </p>
          <p className="text-police-blue font-semibold mb-6">
            {email}
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Por favor revisa tu bandeja de entrada y sigue las instrucciones.
          </p>
          <Link
            to="/login"
            className="inline-block bg-police-blue text-white px-6 py-3 rounded-md hover:bg-police-lightblue transition font-medium"
          >
            Volver al Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-police-blue to-police-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white p-4 rounded-full mb-4">
            <svg className="w-16 h-16 text-police-blue" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-blue-200">
            Te enviaremos instrucciones para restablecerla
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico o Legajo
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-police-blue focus:border-transparent transition"
                placeholder="correo@ejemplo.com"
              />
              <p className="mt-2 text-xs text-gray-500">
                Ingresa tu correo electrónico o legajo asociado a tu cuenta
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-police-blue text-white py-3 px-4 rounded-md hover:bg-police-lightblue transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Enviando...' : 'Enviar Instrucciones'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-police-blue hover:underline font-medium">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>

        <div className="mt-6 bg-blue-900 bg-opacity-50 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-200 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-100">
              <p className="font-semibold mb-1">Nota de Seguridad</p>
              <p className="text-xs">
                Si no recibes el correo en los próximos minutos, revisa tu carpeta de spam o contacta al soporte técnico.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-blue-100">
          <p>© 2025 Equilybrio Group</p>
        </div>
      </div>
    </div>
  );
}