import { useEffect, useState, useRef } from 'react';
import { auth } from '../firebase/config';

// Variable global para rastrear si ya hay una conexión activa
let globalWebSocketInstance = null;
let isConnecting = false;

export function useWebSocket(url) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  const connect = async () => {
    if (!navigator.onLine) {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      return;
    }

    // Si ya hay una conexión activa, reutilizarla
    if (globalWebSocketInstance && globalWebSocketInstance.readyState === WebSocket.OPEN) {
      wsRef.current = globalWebSocketInstance;
      setIsConnected(true);
      setConnectionStatus('connected');
      return;
    }

    // Si hay una conexión en proceso, esperar a que termine
    if (isConnecting || (globalWebSocketInstance && globalWebSocketInstance.readyState === WebSocket.CONNECTING)) {
      // Esperar y volver a intentar
      setTimeout(() => {
        if (isMountedRef.current) {
          connect();
        }
      }, 200);
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setConnectionStatus('disconnected');
        setIsConnected(false);
        return;
      }

      isConnecting = true;
      setConnectionStatus('connecting');
      setIsConnected(false);

      const token = await currentUser.getIdToken();
      const fullUrl = `${url}?token=${token}`;
      
      // Crear conexión WebSocket
      const ws = new WebSocket(fullUrl);
      globalWebSocketInstance = ws;
      wsRef.current = ws;

      ws.onopen = () => {
        isConnecting = false;
        if (!isMountedRef.current) return;
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
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
            // Agregar un ID único basado en los datos para evitar duplicados
            const notificationId = data.data?.id 
              ? `${data.notification_type || 'general'}_${data.data.id}`
              : `${data.notification_type || 'general'}_${data.timestamp || Date.now()}_${data.message?.substring(0, 30) || ''}`;
            
            console.log('useWebSocket: Notificación general recibida', data, 'ID:', notificationId);
            
            // Verificar si ya se disparó este evento recientemente (últimos 2 segundos)
            const eventKey = `ws_notif_${notificationId}`;
            const lastEventTime = window[eventKey];
            const now = Date.now();
            
            if (lastEventTime && (now - lastEventTime) < 2000) {
              console.log('useWebSocket: Evento duplicado ignorado (disparado hace menos de 2 segundos)', notificationId);
              return;
            }
            
            // Marcar el tiempo del evento
            window[eventKey] = now;
            
            // Limpiar después de 5 segundos
            setTimeout(() => {
              delete window[eventKey];
            }, 5000);
            
            window.dispatchEvent(new CustomEvent('generalNotification', {
              detail: {
                ...data,
                timestamp: data.timestamp || new Date().toISOString(),
                _notificationId: notificationId // Incluir ID para referencia
              }
            }));
            console.log('useWebSocket: Evento generalNotification disparado', notificationId);
          } else if (data.type === 'new_message') {
            // Nuevo mensaje recibido
            window.dispatchEvent(new CustomEvent('newMessage', {
              detail: {
                message: data.message,
                sender_uid: data.sender_uid
              }
            }));
          }
        } catch (error) {
          console.error('Error parseando mensaje WebSocket:', error);
        }
      };

      ws.onerror = () => {
        isConnecting = false;
        if (!isMountedRef.current) return;
        setConnectionStatus('error');
      };

      ws.onclose = (event) => {
        isConnecting = false;
        
        // Limpiar la referencia global si esta es la conexión activa
        if (globalWebSocketInstance === ws) {
          globalWebSocketInstance = null;
        }
        
        if (!isMountedRef.current) return;
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
      isConnecting = false;
      console.error('Error conectando WebSocket:', error);
      if (!isMountedRef.current) return;
      setConnectionStatus('error');
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (auth.currentUser && isMountedRef.current) {
          connect();
        }
      }, 5000);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    
    const handleOnline = () => {
      setIsOnline(true);
      if (auth.currentUser && !isConnected && isMountedRef.current) {
        connect();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionStatus('disconnected');
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Conectar cuando el componente se monta
    if (navigator.onLine && auth.currentUser) {
      connect();
    }

    // Limpiar al desmontar
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      // No cerrar el WebSocket global, solo limpiar referencia local
      wsRef.current = null;
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

