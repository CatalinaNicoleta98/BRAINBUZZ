import { apiBaseUrl } from "../config/runtime";

const API_BASE_URL = apiBaseUrl;

export interface ApiErrorDetail {
  path?: string;
  message?: string;
}

export class ApiError extends Error {
  details: ApiErrorDetail[];

  constructor(message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.details = details;
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { headers: initHeaders, ...restInit } = init ?? {};

  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    ...restInit,
    headers: {
      "Content-Type": "application/json",
      ...(initHeaders ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | {
          message?: string;
          errors?: Array<{ path?: string; message?: string }>;
        }
      | null;

    const details = body?.errors
      ?.map((error) => error.message?.trim())
      .filter((message): message is string => Boolean(message));

    throw new ApiError(details?.length ? details.join(" ") : body?.message ?? "Request failed.", body?.errors ?? []);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export { API_BASE_URL };
