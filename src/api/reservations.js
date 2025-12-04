import api from "./client";

const BASE = `/api/reservations`;

export async function listReservations() {
  const res = await api.get(`${BASE}/`);
  return res.data?.reservations || [];
}

export async function getCalendarEvents() {
  const res = await api.get(`${BASE}/calendar/`);
  return res.data?.events || [];
}

export async function getCalendarNotes() {
  const res = await api.get(`${BASE}/calendar/notes/`);
  return res.data?.notes || [];
}

export async function setCalendarNote(date, text) {
  const res = await api.put(`${BASE}/calendar/notes/${date}/`, { text });
  return res.data?.note || null;
}

export async function deleteCalendarNote(date) {
  await api.delete(`${BASE}/calendar/notes/${date}/`);
}

export async function createReservation(data) {
  const res = await api.post(`${BASE}/create/`, data);
  return res.data?.reservation || null;
}

export async function updateReservation(reservationId, data) {
  const res = await api.patch(`${BASE}/${reservationId}/`, data);
  return res.data?.reservation || null;
}

export async function deleteReservation(reservationId) {
  await api.delete(`${BASE}/${reservationId}/`);
}

export async function lookupDocument(type, number) {
  const res = await api.get(`${BASE}/lookup/`, { params: { type, number } });
  return res.data || {};
}

export async function getAvailableRooms(checkIn, checkOut, excludeReservation = null) {
  const params = { check_in: checkIn, check_out: checkOut };
  if (excludeReservation) {
    params.exclude_reservation = excludeReservation;
  }
  const res = await api.get(`${BASE}/rooms/available/`, { params });
  return res.data?.rooms || [];
}

export async function getAllRooms() {
  const res = await api.get(`${BASE}/rooms/all/`);
  return res.data?.rooms || [];
}

export async function getReservationDetail(reservationId) {
  const res = await api.get(`${BASE}/${reservationId}/`);
  return res.data?.reservation || null;
}
