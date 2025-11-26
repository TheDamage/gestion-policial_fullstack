import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@shared/utils/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    // Verificar si hay usuario guardado
    const storedUser = localStorage.getItem('user');
    const storedPermissions = localStorage.getItem('user_permissions');
    const token = localStorage.getItem('access_token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
      setPermissions(storedPermissions ? JSON.parse(storedPermissions) : []);
      setIsAuthenticated(true);
      
      // Opcional: Verificar permisos actualizados del servidor
      loadUserPermissions();
    }
    
    setLoading(false);
  }, []);

  const loadUserPermissions = async () => {
    try {
      const response = await apiClient.get('/auth/me/permissions');
      if (response.data.success) {
        const userPermissions = response.data.data.permissions || [];
        setPermissions(userPermissions);
        localStorage.setItem('user_permissions', JSON.stringify(userPermissions));
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Si falla, usar permisos por defecto basados en roles
      setDefaultPermissions();
    }
  };

  const setDefaultPermissions = () => {
    if (!user || !user.roles) return;
    
    let defaultPermissions = [];
    
    // Si es admin, otorgar todos los permisos
    if (user.roles.includes('admin') || user.roles.includes('administrador')) {
      defaultPermissions = [
        'capacitaciones.ver',
        'capacitaciones.crear',
        'capacitaciones.editar', 
        'capacitaciones.eliminar',
        'capacitaciones.gestionar_participantes',
        'capacitaciones.asignar',
        'capacitaciones.exportar'
      ];
    } 
    // Si es supervisor o coordinador
    else if (user.roles.includes('supervisor') || user.roles.includes('coordinador')) {
      defaultPermissions = [
        'capacitaciones.ver',
        'capacitaciones.crear',
        'capacitaciones.editar',
        'capacitaciones.gestionar_participantes',
        'capacitaciones.exportar'
      ];
    }
    // Usuario normal solo puede ver
    else {
      defaultPermissions = ['capacitaciones.ver'];
    }
    
    setPermissions(defaultPermissions);
    localStorage.setItem('user_permissions', JSON.stringify(defaultPermissions));
  };

  const login = async (legajo, password, deviceInfo = {}) => {
    try {
      const response = await apiClient.post('/auth/login', {
        legajo,
        password,
        device_info: {
          device_id: deviceInfo.deviceId || generateDeviceId(),
          platform: navigator.platform,
          user_agent: navigator.userAgent,
          ...deviceInfo
        }
      });

      const { access_token, refresh_token, user: userData } = response.data.data;

      // Guardar tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setIsAuthenticated(true);

      // Cargar permisos del usuario
      await loadUserPermissions();

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Error de autenticación'
      };
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpiar estado y storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('user_permissions');
      setUser(null);
      setIsAuthenticated(false);
      setPermissions([]);
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const hasPermission = (permission) => {
    if (!user) {
      console.log('No user found');
      return false;
    }
    
    console.log('=== DEBUG PERMISOS ===');
    console.log('User object:', user);
    console.log('Checking permission:', permission);
    
    // VERSIÓN ACTUAL: Verificar si es admin por diferentes campos posibles
    const isAdmin = (
      user.role_id === '550e8400-e29b-41d4-a716-446655440001' || // ID del rol admin
      user.username === 'admin' ||                                // Username admin
      user.rango === 'Administrador' ||                          // Rango administrador
      (user.roles && user.roles.includes('admin')) ||            // Array de roles
      (user.role && user.role.name === 'admin') ||               // Objeto role
      (user.role_name === 'admin')                               // Nombre del rol directo
    );
    
    console.log('Is admin check:', isAdmin);
    console.log('User role_id:', user.role_id);
    console.log('User username:', user.username);
    console.log('User rango:', user.rango);
    
    if (isAdmin) {
      console.log('✅ Admin user detected - permission granted');
      return true;
    }
    
    // Para otros usuarios, verificar permisos específicos cuando esté implementado
    console.log('❌ Not admin - permission denied');
    return false;
    
    /*
    // VERSIÓN DEFINITIVA (Comentada para implementar después):
    // Una vez que tengas el endpoint /auth/me/permissions funcionando,
    // reemplazar todo lo de arriba con esto:
    
    // Si es admin, tiene todos los permisos
    if (user.role_id === '550e8400-e29b-41d4-a716-446655440001' || 
        (user.role && user.role.name === 'admin')) {
      return true;
    }
    
    // Verificar permisos específicos del array permissions
    return permissions.includes(permission);
    */
  };
  const hasRole = (role) => {
    return user && user.roles && user.roles.includes(role);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    permissions,
    login,
    logout,
    updateUser,
    hasPermission,
    hasRole,
    loadUserPermissions
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Helper para generar device ID
function generateDeviceId() {
  let deviceId = localStorage.getItem('device_id');
  
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('device_id', deviceId);
  }
  
  return deviceId;
}