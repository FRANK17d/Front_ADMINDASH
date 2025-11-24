import api from "./client";

const AUTH_BASE = `/api/auth`;

export async function listUsers() {
  try {
    const res = await api.get(`${AUTH_BASE}/admin/users/`);
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    const msg = error?.response?.data?.error || `LIST_USERS_FAILED:${status ?? "UNKNOWN"}`;
    console.error("Error en listUsers:", msg);
    throw new Error(msg);
  }
}

export async function createUser({ email, password, role, display_name, salary, entry_date, attendance }) {
  try {
    const res = await api.post(`${AUTH_BASE}/admin/users/create/`, {
      email,
      password,
      role,
      display_name,
      salary,
      entry_date,
      attendance,
    });
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    const msg = error?.response?.data?.error || `CREATE_USER_FAILED:${status ?? "UNKNOWN"}`;
    throw new Error(msg);
  }
}

export async function updateUser(uid, { role, salary, entry_date, attendance }) {
  try {
    const res = await api.put(`${AUTH_BASE}/admin/users/${uid}/role/`, {
      role,
      salary,
      entry_date,
      attendance,
    });
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    const msg = error?.response?.data?.error || `UPDATE_USER_FAILED:${status ?? "UNKNOWN"}`;
    throw new Error(msg);
  }
}

export async function updateUserRole(uid, role) {
  return updateUser(uid, { role });
}

export async function deleteUser(uid) {
  try {
    const res = await api.delete(`${AUTH_BASE}/admin/users/${uid}/`);
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    throw new Error(`DELETE_USER_FAILED:${status ?? "UNKNOWN"}`);
  }
}

export async function updateOwnProfile({ display_name, profile_photo_url }) {
  try {
    const res = await api.patch(`${AUTH_BASE}/profile/update/`, {
      display_name,
      profile_photo_url,
    });
    return res.data;
  } catch (error) {
    const status = error?.response?.status;
    const msg = error?.response?.data?.error || `UPDATE_PROFILE_FAILED:${status ?? "UNKNOWN"}`;
    throw new Error(msg);
  }
}

export async function getOwnProfile() {
  try {
    const res = await api.get(`${AUTH_BASE}/profile/`);
    return res.data.profile || null;
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || error?.message === "NOT_AUTHENTICATED") {
      return null;
    }
    const msg = `GET_PROFILE_FAILED:${status ?? "UNKNOWN"}`;
    console.error("Error en getOwnProfile:", msg);
    throw new Error(msg);
  }
}

