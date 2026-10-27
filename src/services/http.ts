import axios, { AxiosError } from "axios";
import { tokenStore } from "./tokenStore";

export class ApiError extends Error {
  status: number;
  errors?: Array<{
    field: string;
    message: string;
  }>;

  constructor(
    status: number,
    message: string,
    errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type UnauthorizedListener = () => void;

const unauthorizedListeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);

  return () => {
    unauthorizedListeners.delete(listener);
  };
}

const axiosClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://127.0.0.1:5001",
  withCredentials: true,
  
});

axiosClient.interceptors.request.use((config) => {
  const token = tokenStore.get();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{
    message?: string;
    errors?: Array<{ field: string; message: string }>;
  }>) => {
    const status = error.response?.status || 500;
    const message =
      error.response?.data?.message ||
      "Something went wrong. Please try again.";

    if (status === 401 && tokenStore.get()) {
      tokenStore.clear();

      unauthorizedListeners.forEach((listener) => {
        listener();
      });
    }

    return Promise.reject(
      new ApiError(
        status,
        message,
        error.response?.data?.errors
      )
    );
  }
);

export interface RequestOptions {
  params?: Record<string, unknown>;
}

export const http = {
  async get<T>(
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const response = await axiosClient.get<T>(path, options);
    return response.data;
  },

  async post<T>(
    path: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const response = await axiosClient.post<T>(
      path,
      data,
      options
    );
    return response.data;
  },

  async patch<T>(
    path: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const response = await axiosClient.patch<T>(
      path,
      data,
      options
    );
    return response.data;
  },

  async delete<T>(
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const response = await axiosClient.delete<T>(
      path,
      options
    );
    return response.data;
  },
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}