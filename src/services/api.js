import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:3-8080",
    timeout: 10000,
});

api.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
        (error) => {
            return Promise.reject(error);
        }
    );
export default api;