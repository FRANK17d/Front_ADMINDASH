import api from "./client";

// Consulta a la API para DNI, CE y RUC
export async function lookupDocumento(type, number) {
  try {
    const res = await api.get(`api/huespedes/lookup/`, { params: { type, number } });
    return res.data || {};
  } catch (error) {
    // Manejar errores específicos
    const status = error?.response?.status;

    if (status === 405) {
      // Límite de consultas alcanzado
      const customError = new Error("Alcanzaste el límite de consultas. Intenta más tarde.");
      customError.response = {
        data: { error: "Alcanzaste el límite de consultas. Intenta más tarde." },
        status: 405
      };
      throw customError;
    }

    if (status === 429) {
      // Too Many Requests
      const customError = new Error("Demasiadas consultas. Espera un momento.");
      customError.response = {
        data: { error: "Demasiadas consultas. Espera un momento." },
        status: 429
      };
      throw customError;
    }

    if (status === 404) {
      // No encontrado
      const customError = new Error("Documento no encontrado.");
      customError.response = {
        data: { error: "Documento no encontrado." },
        status: 404
      };
      throw customError;
    }

    // Para otros errores, re-lanzar el error original
    throw error;
  }
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
