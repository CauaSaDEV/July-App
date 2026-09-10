import api from "./api";

export async function getMe(){
    const { data } = await api.get("/auth/me");
    return data;
}