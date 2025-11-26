import api from "./client";

const BASE = "/api/lavanderia";

export async function getStock() {
  const res = await api.get(`${BASE}/stock/`);
  return res.data?.stock || [];
}

export async function upsertStock(items) {
  const res = await api.post(`${BASE}/stock/upsert/`, { items });
  return res.data?.updated || [];
}

export async function sendLaundry(payload) {
  const res = await api.post(`${BASE}/send/`, payload);
  return res.data?.order;
}

export async function returnOrder(orderCode) {
  const res = await api.post(`${BASE}/return/${orderCode}/`);
  return res.data;
}

export async function listOrders() {
  const res = await api.get(`${BASE}/orders/`);
  return res.data?.orders || [];
}

export async function updateDamage(category, quantity, action = "add") {
  const res = await api.post(`${BASE}/damage/`, { category, quantity, action });
  return res.data;
}