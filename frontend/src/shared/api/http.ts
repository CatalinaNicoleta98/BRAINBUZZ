import { apiBaseUrl } from "../config/runtime";

const API_BASE_URL = apiBaseUrl;

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
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

    throw new Error(details?.length ? details.join(" ") : body?.message ?? "Request failed.");
  }

  return response.json() as Promise<T>;
}

export { API_BASE_URL };
