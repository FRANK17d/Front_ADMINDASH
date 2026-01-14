import axios from "axios";
import { auth } from "../firebase/config";

// URL del backend API
// Para desarrollo local: http://localhost:8000
// Para producción: https://tu-app.seenode.app (reemplaza con tu URL real)
// También puedes crear un archivo .env con: VITE_API_URL=https://tu-app.seenode.app
const BASE_URL = import.meta?.env?.VITE_API_URL || "https://plazabolognesi.api.com.plazabolognesi.com";

const api = axios.create({ baseURL: BASE_URL });

// Interceptor de request - agregar token
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("NOT_AUTHENTICATED");
    }
    const token = await currentUser.getIdToken();
    config.headers = {
      ...(config.headers || {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response - manejar errores HTTP con mensajes amigables
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    // Solo aplicar mensajes personalizados para la API de lookup
    if (url.includes("lookup")) {
      if (status === 405) {
        error.response = {
          ...error.response,
          data: { error: "Alcanzaste el límite de consultas. Intenta más tarde." }
        };
      } else if (status === 429) {
        error.response = {
          ...error.response,
          data: { error: "Demasiadas consultas. Espera un momento." }
        };
      } else if (status === 404) {
        error.response = {
          ...error.response,
          data: { error: "Documento no encontrado en el registro." }
        };
      } else if (status === 400) {
        error.response = {
          ...error.response,
          data: { error: error?.response?.data?.error || "Documento inválido o no encontrado." }
        };
      } else if (status >= 500) {
        error.response = {
          ...error.response,
          data: { error: "Error en el servicio de consulta. Intenta más tarde." }
        };
      }
    }

    return Promise.reject(error);
  }
);

export default api;