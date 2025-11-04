import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext();

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  RECEPTIONIST: 'receptionist'
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
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
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
    isSuperadmin: userRole === ROLES.SUPERADMIN,
    // isAdmin incluye superadmin para permisos del panel
    isAdmin: userRole === ROLES.ADMIN || userRole === ROLES.SUPERADMIN,
    isReceptionist: userRole === ROLES.RECEPTIONIST
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