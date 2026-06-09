const TOKEN_STORAGE_KEYS = ["access_token", "ecogreen.access_token"] as const;

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      `http://${window.location.hostname}:3001`
    );
  }

  return API_URL;
}

type ApiResponseEnvelope<T> = {
  statusCode?: number;
  message?: string;
  data: T;
};

function isApiResponseEnvelope<T>(value: unknown): value is ApiResponseEnvelope<T> {
  return Boolean(
    value &&
      typeof value === "object" &&
      "statusCode" in value &&
      "data" in value,
  );
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const queryToken = new URLSearchParams(window.location.search).get("token");
  if (queryToken) {
    for (const key of TOKEN_STORAGE_KEYS) {
      window.localStorage.setItem(key, queryToken);
    }

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("token");
    window.history.replaceState(null, "", cleanUrl.toString());

    return queryToken;
  }

  for (const key of TOKEN_STORAGE_KEYS) {
    const token = window.localStorage.getItem(key);
    if (token) {
      return token;
    }
  }

  return null;
}

export function clearAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of TOKEN_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

export async function requestJson<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const token = getAccessToken();
  const headers = new Headers(options?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const message =
      errorBody &&
      typeof errorBody === "object" &&
      "message" in errorBody &&
      typeof errorBody.message === "string"
        ? errorBody.message
        : "Da co loi xay ra khi goi API";
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : undefined;

  if (isApiResponseEnvelope<T>(body)) {
    return body.data;
  }

  return body as T;
}

export const fetcher = requestJson;
