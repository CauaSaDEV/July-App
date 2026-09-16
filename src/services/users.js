import api from "./api";
 
export async function getUsers(params = {}) {
  const { data } = await api.get("/users", { params });
  return data;
}
 