import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Alert, Platform } from "react-native";

// Função segura para ler do SecureStore em qualquer plataforma
async function getStoredToken() {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem("token");
    }
    return await SecureStore.getItemAsync("token");
  } catch (err) {
    console.log("[api] Erro ao ler token do SecureStore:", err);
    return null;
  }
}

const api = axios.create({
  baseURL: "http://192.168.114.45:8080",
  timeout: 10000,
});

const notifyError = (error) => {
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Ocorreu um erro de conexão com o servidor.";

  Alert.alert("Erro", String(message));
};

// 1. Interceptor de Requisição
api.interceptors.request.use(
  async (config) => {
    if (config.url?.includes("/auth/login")) {
      delete config.headers.Authorization;
      return config;
    }

    const token = await getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Interceptor de Resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const skip = error?.config?.skipErrorAlert;
    
    const isAuthError = error?.response?.status === 401 || error?.response?.status === 403;

    if (!skip && !isAuthError) {
      notifyError(error);
    }

    return Promise.reject(error);
  }
);

export default api;