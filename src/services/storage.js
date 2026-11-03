import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export async function salvarItem(chave, valor) {
  if (Platform.OS === "web") {
    localStorage.setItem(chave, valor);
    return;
  }
  await SecureStore.setItemAsync(chave, valor);
}

export async function lerItem(chave) {
  if (Platform.OS === "web") return localStorage.getItem(chave);
  return SecureStore.getItemAsync(chave);
}

export async function removerItem(chave) {
  if (Platform.OS === "web") {
    localStorage.removeItem(chave);
    return;
  }
  await SecureStore.deleteItemAsync(chave);
}