import axios from "axios";
import { auth } from "../firebase/config";

const BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:8000";

const api = axios.create({ baseURL: BASE_URL });

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

export default api;