import { auth } from "../firebase/config";

const BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:8000";
const AUTH_BASE = `${BASE_URL}/api/auth`;

async function getAuthHeaders() {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    console.error("No hay usuario autenticado en Firebase");
    throw new Error("NOT_AUTHENTICATED");
  }
  try {
    const token = await currentUser.getIdToken();
    
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    return headers;
  } catch (error) {
    console.error("Error obteniendo token:", error);
    throw new Error("TOKEN_ERROR");
  }
}

export async function listUsers() {
  try {
    const headers = await getAuthHeaders();
    
    const res = await fetch(`${AUTH_BASE}/admin/users/`, { 
      headers,
      method: 'GET'
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error del servidor:", errorText);
      throw new Error(`LIST_USERS_FAILED:${res.status}`);
    }
    
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error en listUsers:", error);
    throw error;
  }
}

export async function createUser({ email, password, role, display_name, salary, entry_date, attendance }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AUTH_BASE}/admin/users/create/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, role, display_name, salary, entry_date, attendance }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || `CREATE_USER_FAILED:${res.status}`;
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function updateUser(uid, { role, salary, entry_date, attendance }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AUTH_BASE}/admin/users/${uid}/role/`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ role, salary, entry_date, attendance }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || `UPDATE_USER_FAILED:${res.status}`;
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function updateUserRole(uid, role) {
  return updateUser(uid, { role });
}

export async function deleteUser(uid) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AUTH_BASE}/admin/users/${uid}/`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(`DELETE_USER_FAILED:${res.status}`);
  return res.json();
}

export async function updateOwnProfile({ display_name, profile_photo_url }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AUTH_BASE}/profile/update/`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ display_name, profile_photo_url }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || `UPDATE_PROFILE_FAILED:${res.status}`;
    throw new Error(errorMessage);
  }
  return res.json();
}

export async function getOwnProfile() {
  try {
    const headers = await getAuthHeaders();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("No hay usuario autenticado");
    }
    
    const res = await fetch(`${AUTH_BASE}/profile/`, { 
      headers,
      method: 'GET'
    });
    
    if (!res.ok) {
      if (res.status === 401) {
        return null;
      }
      throw new Error(`GET_PROFILE_FAILED:${res.status}`);
    }
    
    const data = await res.json();
    return data.profile || null;
  } catch (error) {
    console.error("Error en getOwnProfile:", error);
    throw error;
  }
}

