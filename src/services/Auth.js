import api from "./api";
import * as SecureStore from "expo-secure-store";


export async function getMe(){
    const { data } = await api.get("/auth/me");
    return data;
}

export async function logout() {
  await SecureStore.deleteItemAsync("token"); // use a mesma chave do seu login
}