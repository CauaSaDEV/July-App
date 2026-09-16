import api from "./api";

export async function getClients(params = {}){
 const { data } = await api.get("/clients", { params });
 return data;
}

export async function getClientById(id) {
    const { data } = await api.get(`/clients/${id}`);
    return data;    
}

export async function createClient(payload){
    const { data } = await api.post("/clients", payload);
    return data;
}

export async function updateClient(id, payload) {
  const { data } = await api.put(`/clients/${id}`, payload);
  return data;
}
