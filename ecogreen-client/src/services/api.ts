// src/services/api.ts
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export const fetcher = async (endpoint: string, options?: RequestInit) => {
  // Lấy token từ localStorage (nếu chạy trên client)
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("access_token");
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error(
      errorBody?.message || "Đã có lỗi xảy ra khi gọi API"
    );
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
};

export { API_URL };
