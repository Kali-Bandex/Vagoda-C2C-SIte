import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "https://vagoda-c2c-site.onrender.com/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send httpOnly refresh cookie
  headers: {
    "Content-Type": "application/json",
  },
});

let accessTokenMemory: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessTokenMemory = token;
  if (typeof window !== "undefined") {
    if (token) {
      localStorage.setItem("vagoda_access_token", token);
    } else {
      localStorage.removeItem("vagoda_access_token");
    }
  }
};

export const getAccessToken = (): string | null => {
  if (accessTokenMemory) return accessTokenMemory;
  if (typeof window !== "undefined") {
    accessTokenMemory = localStorage.getItem("vagoda_access_token");
  }
  return accessTokenMemory;
};

// Request interceptor to attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auto token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/signup") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const { accessToken } = res.data;
        setAccessToken(accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
