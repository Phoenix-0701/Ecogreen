// src/services/api.ts
const TOKEN_STORAGE_KEY = "ecogreen.access_token";

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      `http://${window.location.hostname}:3001`
    );
  }

  return (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3001"
  );
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const queryToken = new URLSearchParams(window.location.search).get("token");
  if (queryToken) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, queryToken);

    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("token");
    window.history.replaceState(null, "", cleanUrl.toString());

    return queryToken;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearAccessToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
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
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error("Đã có lỗi xảy ra khi gọi API");
  }

  return res.json() as Promise<T>;
}

export const fetcher = requestJson;
