import { createContext, useContext, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWebSocket } from '../../hooks/useWebSocket';

// Construir URL de WebSocket basándose en la URL de la API
const getWebSocketUrl = () => {
  // Si hay una URL de WebSocket específica en las variables de entorno, usarla
  if (import.meta?.env?.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  
  // Si no, construirla basándose en la URL de la API
  const apiUrl = import.meta?.env?.VITE_API_URL || "https://web-m6c7e8zv43a9.up-de-fra1-k8s-1.apps.run-on-seenode.com";
  
  // Convertir http:// a ws:// y https:// a wss://
  const wsUrl = apiUrl
    .replace(/^http:/, 'ws:')
    .replace(/^https:/, 'wss:');
  
  // Agregar la ruta del WebSocket
  return `${wsUrl}/ws/presence/`;
};

const WS_URL = getWebSocketUrl();

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

