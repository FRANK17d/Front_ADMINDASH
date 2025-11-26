import api from "./client";

const BASE = "/api/chatbot";

export async function processChatbotMessage(message, sessionId) {
  const res = await api.post(`${BASE}/message/`, {
    message,
    session_id: sessionId,
  });
  return res.data;
}

export async function getChatbotHistory(sessionId = null) {
  const params = sessionId ? { session_id: sessionId } : {};
  const res = await api.get(`${BASE}/history/`, { params });
  return res.data;
}

export async function endChatbotSession(sessionId) {
  const res = await api.post(`${BASE}/end-session/`, {
    session_id: sessionId,
  });
  return res.data;
}

