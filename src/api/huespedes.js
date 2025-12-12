import api from "./client";

// Consulta a la API para DNI, CE y RUC
export async function lookupDocumento(type, number) {
  const res = await api.get(`api/huespedes/lookup/`, { params: { type, number } });
  return res.data || {};
}

// Obtener todos los huéspedes
export const getHuespedes = async () => {
  const response = await api.get("/api/huespedes/");
  return response.data;
};

// Crear nuevo huésped
export const createHuesped = async (data) => {
  const response = await api.post("/api/huespedes/crear/", data);
  return response.data;
};

// Obtener huésped por ID
export const getHuespedById = async (id) => {
  const response = await api.get(`/api/huespedes/${id}/`);
  return response.data;
};

// Actualizar huésped
export const updateHuesped = async (id, data) => {
  const response = await api.put(`/api/huespedes/${id}/actualizar/`, data);
  return response.data;
};

// Eliminar huésped
export const deleteHuesped = async (id) => {
  const response = await api.delete(`/api/huespedes/${id}/eliminar/`);
  return response.data;
};
