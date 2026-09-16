import api from "./api";
 
export async function getServiceCatalog(params = {}) {
  const { data } = await api.get("/services", { params });
  return data;
}
 