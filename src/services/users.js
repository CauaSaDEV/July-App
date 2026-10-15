import api from "./api";

// Todos os endpoints de /users exigem papel MANAGER (STAFF recebe 403).

export async function getUsers(params = {}) {
  const { data } = await api.get("/users", { params });
  return data; // UserResponse[]
}

export async function createUser(payload) {
  // payload: { name, email, password (6-100), role: "MANAGER" | "STAFF" }
  const { data } = await api.post("/users", payload);
  return data;
}

export async function deactivateUser(id) {
  const { data } = await api.patch(`/users/${id}/deactivate`);
  return data;
}

export async function activateUser(id) {
  const { data } = await api.patch(`/users/${id}/activate`);
  return data;
}

export async function resetUserPassword(id, password) {
  const { data } = await api.patch(`/users/${id}/password`, { password });
  return data;
}