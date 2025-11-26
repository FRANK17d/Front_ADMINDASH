import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getOwnProfile } from '../api/users';

const AuthContext = createContext();

export const ROLES = {
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist',
  HOUSEKEEPING: 'housekeeping'
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Obtener custom claims para determinar el rol
        const tokenResult = await firebaseUser.getIdTokenResult();
        const role = tokenResult.claims.role;
        
        setUser(firebaseUser);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password, rememberMe = false) => {
    try {
      // Configurar persistencia basada en el checkbox
      const persistence = import.meta?.env?.DEV
        ? (rememberMe ? browserLocalPersistence : browserSessionPersistence)
        : browserLocalPersistence;
      await setPersistence(auth, persistence);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Verificar el rol después del login
      const tokenResult = await userCredential.user.getIdTokenResult();
      const role = tokenResult.claims.role;

      // Si no tiene rol asignado, hacer logout inmediatamente y lanzar error
      if (!role) {
        await signOut(auth);
        throw new Error('NO_ROLE_ASSIGNED');
      }

      // Verificar si el correo está verificado (solo para housekeeping y receptionist)
      if (role === ROLES.HOUSEKEEPING || role === ROLES.RECEPTIONIST) {
        try {
          const profile = await getOwnProfile();
          if (profile && !profile.email_verified) {
            await signOut(auth);
            throw new Error('EMAIL_NOT_VERIFIED');
          }
        } catch (error) {
          // Si hay error obteniendo el perfil, verificar si es el error de verificación
          if (error.message === 'EMAIL_NOT_VERIFIED') {
            throw error;
          }
          // Si es otro error, continuar (puede ser que el perfil no exista aún)
          console.warn('Error obteniendo perfil durante login:', error);
        }
      }

      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    user,
    userRole,
    loading,
    login,
    logout,
    isAdmin: userRole === ROLES.ADMIN,
    isReceptionist: userRole === ROLES.RECEPTIONIST,
    isHousekeeping: userRole === ROLES.HOUSEKEEPING
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
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};