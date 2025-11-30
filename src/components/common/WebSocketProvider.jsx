import { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';

const WS_URL = import.meta?.env?.VITE_WS_URL || "ws://localhost:8000/ws/presence/";

// Crear contexto para compartir el estado de WebSocket
const WebSocketContext = createContext(null);

/**
 * Hook para acceder al estado de WebSocket desde cualquier componente
 */
export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    // Si no hay contexto, retornar valores por defecto
    return {
      isConnected: false,
      connectionStatus: 'disconnected',
      isOnline: navigator.onLine
    };
  }
  return context;
}

/**
 * Componente que mantiene la conexión WebSocket activa globalmente
 * Esto permite que las notificaciones funcionen en toda la aplicación
 */
export default function WebSocketProvider({ children }) {
  const { user, loading } = useAuth();
  const { isConnected, connectionStatus, isOnline } = useWebSocket(WS_URL);

  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log('WebSocket Provider: Usuario autenticado, conexión:', connectionStatus, 'Conectado:', isConnected);
      } else {
        console.log('WebSocket Provider: No hay usuario autenticado');
      }
    }
  }, [user, loading, isConnected, connectionStatus]);

  // Proporcionar el estado de WebSocket a través del contexto
  return (
    <WebSocketContext.Provider value={{ isConnected, connectionStatus, isOnline }}>
      {children}
    </WebSocketContext.Provider>
  );
}

