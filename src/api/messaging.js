import api from "./client";

const MESSAGING_BASE = `/api/messaging`;

// Listar todas las conversaciones del usuario
export async function listConversations() {
  try {
    const res = await api.get(`${MESSAGING_BASE}/conversations/`);
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    const msg = `LIST_CONVERSATIONS_FAILED:${status ?? "UNKNOWN"}`;
    console.error("Error en listConversations:", msg);
    throw new Error(msg);
  }
}

// Listar usuarios disponibles para mensajear
export async function listUsersForMessaging() {
  try {
    const res = await api.get(`${MESSAGING_BASE}/users/`);
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    const msg = `LIST_USERS_FAILED:${status ?? "UNKNOWN"}`;
    console.error("Error en listUsersForMessaging:", msg);
    throw new Error(msg);
  }
}

// Obtener mensajes de una conversación
export async function getMessages(otherUserUid) {
  try {
    const res = await api.get(`${MESSAGING_BASE}/messages/${otherUserUid}/`);
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    const msg = `GET_MESSAGES_FAILED:${status ?? "UNKNOWN"}`;
    console.error("Error en getMessages:", msg);
    throw new Error(msg);
  }
}

// Enviar un mensaje (texto, imagen o archivo)
export async function sendMessage(otherUserUid, messageData) {
  try {
    const res = await api.post(`${MESSAGING_BASE}/send/${otherUserUid}/`, messageData);
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    const msg = error?.response?.data?.error || `SEND_MESSAGE_FAILED:${status ?? "UNKNOWN"}`;
    console.error("Error en sendMessage:", msg);
    throw new Error(msg);
  }
}
