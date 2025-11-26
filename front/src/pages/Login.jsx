import { useState } from 'react';
import { useNavigate, Link} from 'react-router-dom';
import { useAuth } from '../shared/contexts/AuthContext';
import techWaveLogo from '../assets/images/startwave.png';

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    legajo: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirigir si ya está autenticado
  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.legajo, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-police-blue to-police-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white p-4 rounded-full mb-4">
            <img 
              src={techWaveLogo} 
              alt="TechWave Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Gestion Segura
          </h1>
          <p className="text-blue-200">
            Seguridad inteligente
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="legajo" className="block text-sm font-medium text-gray-700 mb-2">
                Legajo
              </label>
              <input
                type="text"
                id="legajo"
                name="legajo"
                value={formData.legajo}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-police-blue focus:border-transparent transition"
                placeholder="Ingrese su legajo"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-police-blue focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-police-blue text-white py-3 px-4 rounded-md hover:bg-police-lightblue transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-600">
            <div className="space-y-2">
              <p>¿No tienes cuenta? <Link to="/register" className="text-police-blue hover:underline font-medium">Regístrate aquí</Link></p>
              <p><Link to="/forgot-password" className="text-police-blue hover:underline">¿Olvidaste tu contraseña?</Link></p>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>¿Problemas para acceder?</p>
            <a href="#" className="text-police-blue hover:underline">
              Contactar soporte técnico
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-blue-100">
          <p>© 2025 Equilybrio Group</p>
        </div>
      </div>
    </div>
  );
}