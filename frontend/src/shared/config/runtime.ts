const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const apiBaseUrl =
  configuredApiBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
