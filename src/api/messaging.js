import { auth } from "../firebase/config";

const BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:8000";
const MESSAGING_BASE = `${BASE_URL}/api/messaging`;

async function getAuthHeaders() {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error("No hay usuario autenticado en Firebase");
    throw new Error("NOT_AUTHENTICATED");
  }
  try {
    const token = await currentUser.getIdToken();
    
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return headers;
  } catch (error) {
    console.error("Error obteniendo token:", error);
    throw new Error("TOKEN_ERROR");
  }
}

// Listar todas las conversaciones del usuario
export async function listConversations() {
  try {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${MESSAGING_BASE}/conversations/`, { 
      headers,
      method: 'GET'
    });
    
    if (!res.ok) {
      throw new Error(`LIST_CONVERSATIONS_FAILED:${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error en listConversations:", error);
    throw error;
  }
}

// Listar usuarios disponibles para mensajear
export async function listUsersForMessaging() {
  try {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${MESSAGING_BASE}/users/`, { 
      headers,
      method: 'GET'
    });
    
    if (!res.ok) {
      throw new Error(`LIST_USERS_FAILED:${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error en listUsersForMessaging:", error);
    throw error;
  }
}

// Obtener mensajes de una conversación
export async function getMessages(otherUserUid) {
  try {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${MESSAGING_BASE}/messages/${otherUserUid}/`, { 
      headers,
      method: 'GET'
    });
    
    if (!res.ok) {
      throw new Error(`GET_MESSAGES_FAILED:${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error en getMessages:", error);
    throw error;
  }
}

// Enviar un mensaje (texto, imagen o archivo)
export async function sendMessage(otherUserUid, messageData) {
  try {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${MESSAGING_BASE}/send/${otherUserUid}/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(messageData),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `SEND_MESSAGE_FAILED:${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error en sendMessage:", error);
    throw error;
  }
}
