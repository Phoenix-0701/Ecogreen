// src/services/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const fetcher = async (endpoint: string, options?: RequestInit) => {
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    throw new Error("Đã có lỗi xảy ra khi gọi API");
  }

  return res.json();
};
