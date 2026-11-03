import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

export async function salvarItem(chave, valor) {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(chave, valor);
    } catch (e) {
      console.warn("[storage] falha ao salvar na web:", e);
    }
    return;
  }
  await SecureStore.setItemAsync(chave, valor);
}

export async function lerItem(chave) {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(chave);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(chave);
}

export async function removerItem(chave) {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(chave);
    } catch {}
    return;
  }
  await SecureStore.deleteItemAsync(chave);
}