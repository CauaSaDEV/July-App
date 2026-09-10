import axios from "axios";
import * as SecureStore from "expo-secure-store";

const api = axios.create({
  baseURL: "http://localhost:8080",
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
    (reponse) => response,
    (error) => {
        const skip = error?.config.skipErrorAlert;
        if (!skip) {
            notifyError(error);
        }
        return Promise.reject(error);
    }
);

export default api;