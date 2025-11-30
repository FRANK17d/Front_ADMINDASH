import api from "./client";

const BASE = "/api/cajacobros";

export async function listTodayTransactions(date = null) {
  const params = date ? { date } : {};
  const res = await api.get(`${BASE}/transactions/today/`, { params });
  return res.data?.transactions || [];
}

export async function todayTotals(date = null) {
  const params = date ? { date } : {};
  const res = await api.get(`${BASE}/totals/today/`, { params });
  return res.data?.totals || { methods: {}, total: 0 };
}

export async function createPayment(data) {
  const res = await api.post(`${BASE}/payments/create/`, data);
  return res.data;
}

export async function emitReceipt(data) {
  const res = await api.post(`${BASE}/receipt/emit/`, data);
  return res.data?.receipt;
}

export async function todayClients() {
  const res = await api.get(`${BASE}/clients/today/`);
  return res.data || { clients: [], total: 0 };
}

export async function allClients() {
  const res = await api.get(`${BASE}/clients/`);
  return res.data || { clients: [], total: 0 };
}

// Clientes desde reservas con paid=true
export async function paidClients() {
  const res = await api.get(`/api/reservations/clients/paid/`);
  return res.data || { clients: [], total: 0 };
}

// Clientes pagados con detalles (DNI y Dirección)
export async function paidClientsDetails() {
  const res = await api.get(`/api/reservations/clients/paid/details/`);
  return res.data || { clients: [], total: 0 };
}