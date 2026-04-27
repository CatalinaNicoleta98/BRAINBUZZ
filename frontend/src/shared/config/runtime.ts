const fallbackApiBaseUrl =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:4000";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || fallbackApiBaseUrl;
