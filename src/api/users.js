import { auth } from "../firebase/config";

const BASE_URL = import.meta?.env?.VITE_API_URL || "http://localhost:8000";
const AUTH_BASE = `${BASE_URL}/api/auth`;

async function getAuthHeaders() {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("NOT_AUTHENTICATED");
  const token = await currentUser.getIdToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function listUsers() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AUTH_BASE}/admin/users/`, { headers });
  if (!res.ok) throw new Error(`LIST_USERS_FAILED:${res.status}`);
  return res.json();
}

export async function createUser({ email, password, role, display_name }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AUTH_BASE}/admin/users/create/`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password, role, display_name }),
  });
  if (!res.ok) throw new Error(`CREATE_USER_FAILED:${res.status}`);
  return res.json();
}

export async function updateUserRole(uid, role) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${AUTH_BASE}/admin/users/${uid}/role/`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error(`UPDATE_ROLE_FAILED:${res.status}`);
  return res.json();
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


