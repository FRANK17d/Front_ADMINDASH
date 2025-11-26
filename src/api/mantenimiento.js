import api from "./client";

const BASE = "/api/mantenimiento";

// Sistema de Agua Caliente
export async function getSystemStatus() {
  const res = await api.get(`${BASE}/system/status/`);
  return res.data;
}

export async function updateSystemStatus(payload) {
  const res = await api.post(`${BASE}/system/update/`, payload);
  return res.data;
}

// Historial de Briquetas
export async function getBriquetteHistory() {
  const res = await api.get(`${BASE}/briquettes/history/`);
  return res.data?.history || [];
}

export async function registerBriquetteChange(payload) {
  const res = await api.post(`${BASE}/briquettes/register/`, payload);
  return res.data;
}

// Incidencias
export async function getMaintenanceIssues() {
  const res = await api.get(`${BASE}/issues/`);
  return res.data?.issues || [];
}

export async function reportIssue(payload) {
  const res = await api.post(`${BASE}/issues/report/`, payload);
  return res.data;
}

export async function deleteIssue(issueId) {
  const res = await api.delete(`${BASE}/issues/delete/${issueId}/`);
  return res.data;
}

// Habitaciones Bloqueadas
export async function getBlockedRooms() {
  const res = await api.get(`${BASE}/rooms/blocked/`);
  return res.data?.rooms || [];
}

export async function blockRoom(payload) {
  const res = await api.post(`${BASE}/rooms/block/`, payload);
  return res.data;
}

export async function unblockRoom(roomId) {
  const res = await api.delete(`${BASE}/rooms/unblock/${roomId}/`);
  return res.data;
}

