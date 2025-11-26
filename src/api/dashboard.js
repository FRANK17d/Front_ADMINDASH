import api from "./client";

const BASE = "/api/dashboard";

export async function getDashboardMetrics() {
  const res = await api.get(`${BASE}/metrics/`);
  return res.data;
}

export async function getMonthlyRevenue() {
  const res = await api.get(`${BASE}/monthly-revenue/`);
  return res.data;
}

export async function getPaymentMethods() {
  const res = await api.get(`${BASE}/payment-methods/`);
  return res.data;
}

export async function getOccupancyWeekly() {
  const res = await api.get(`${BASE}/occupancy-weekly/`);
  return res.data;
}

export async function getTodayCheckinsCheckouts() {
  const res = await api.get(`${BASE}/today-checkins-checkouts/`);
  return res.data;
}

export async function getRecentReservations() {
  const res = await api.get(`${BASE}/recent-reservations/`);
  return res.data;
}

export async function getStatistics() {
  const res = await api.get(`${BASE}/statistics/`);
  return res.data;
}

