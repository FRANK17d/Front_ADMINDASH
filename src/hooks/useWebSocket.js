import { useEffect, useState, useRef } from 'react';
import { auth } from '../firebase/config';

export function useWebSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = async () => {
    // Verificar si el navegador está online
    if (!navigator.onLine) {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      return;
    }

    try {
      // Obtener token de Firebase
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No hay usuario autenticado para WebSocket');
        setConnectionStatus('disconnected');
        setIsConnected(false);
        return;
      }

      // Marcar como conectando
      setConnectionStatus('connecting');
      setIsConnected(false);

      const token = await currentUser.getIdToken();
      
      // Construir URL con token (la URL ya debería ser ws:// o wss://)
      const fullUrl = `${url}?token=${token}`;
      
      // Crear conexión WebSocket
      const ws = new WebSocket(fullUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket conectado');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0; // Resetear intentos de reconexión
        
        // Enviar ping cada 30 segundos para mantener la conexión
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            // Respuesta al ping, conexión activa
            setConnectionStatus('connected');
          } else if (data.type === 'connection_status') {
            setConnectionStatus(data.status);
          } else if (data.type === 'maintenance_notification') {
            // Disparar evento personalizado para notificaciones de mantenimiento
            window.dispatchEvent(new CustomEvent('maintenanceNotification', {
              detail: data
            }));
          } else if (data.type === 'general_notification') {
            // Disparar evento personalizado para notificaciones generales
            console.log('useWebSocket: Notificación general recibida', data);
            window.dispatchEvent(new CustomEvent('generalNotification', {
              detail: {
                ...data,
                timestamp: data.timestamp || new Date().toISOString()
              }
            }));
            console.log('useWebSocket: Evento generalNotification disparado');
          } else {
            console.log('useWebSocket: Tipo de mensaje desconocido', data.type, data);
          }
        } catch (error) {
          console.error('Error parseando mensaje WebSocket:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('Error en WebSocket:', error);
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        console.log('WebSocket desconectado', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Limpiar intervalos
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // No reconectar si fue un cierre intencional (código 1000) o si no hay usuario
        if (event.code === 1000 || !auth.currentUser) {
          return;
        }
        
        // Intentar reconectar con backoff exponencial
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(3000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (auth.currentUser && navigator.onLine) {
            connect();
          }
        }, delay);
      };
    } catch (error) {
      console.error('Error conectando WebSocket:', error);
      setConnectionStatus('error');
      
      // Intentar reconectar después de 5 segundos
      reconnectTimeoutRef.current = setTimeout(() => {
        if (auth.currentUser) {
          connect();
        }
      }, 5000);
    }
  };

  useEffect(() => {
    // Listeners para cambios de conexión del navegador
    const handleOnline = () => {
      console.log('Navegador online');
      setIsOnline(true);
      if (auth.currentUser && !isConnected) {
        connect();
      }
    };

    const handleOffline = () => {
      console.log('Navegador offline');
      setIsOnline(false);
      setConnectionStatus('disconnected');
      setIsConnected(false);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Conectar cuando el componente se monta
    if (navigator.onLine && auth.currentUser) {
      connect();
    }

    // Limpiar al desmontar
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, []);

  // Determinar estado final combinando WebSocket y conexión del navegador
  const finalStatus = !isOnline 
    ? 'disconnected' 
    : connectionStatus === 'connected' && isConnected 
      ? 'connected' 
      : connectionStatus;

  return { 
    isConnected: isConnected && isOnline, 
    connectionStatus: finalStatus,
    isOnline 
  };
}

