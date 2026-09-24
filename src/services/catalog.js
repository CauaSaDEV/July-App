import api from "./api";

export async function getServiceCatalog(params = {}) {
  const { data } = await api.get("/services", { params });
  return data;
}

export async function createService(payload) {
  const { data } = await api.post("/services", payload);
  return data;
}

export async function updateService(id, payload) {
  const { data } = await api.put(`/services/${id}`, payload);
  return data;
}

export async function deactivateService(id) {
  const { data } = await api.patch(`/services/${id}/deactivate`);
  return data;
}