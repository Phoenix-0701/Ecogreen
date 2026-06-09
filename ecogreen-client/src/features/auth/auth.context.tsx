"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { User, LoginPayload, LoginResponse } from "@/types";
import { clearAccessToken, fetcher, getAccessToken, API_URL } from "@/services/api";
import { toast } from "react-hot-toast";

// ============ GOOGLE CLIENT ID ============
// Thay bằng Google Client ID thật từ Google Cloud Console

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  loginWithGoogle: () => void;
  handleGoogleCallback: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const savedUser = localStorage.getItem("user_info");

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as User;
  } catch {
    localStorage.removeItem("user_info");
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [isLoading] = useState(false);

  // Khởi tạo - đọc token từ localStorage
  // Đăng nhập bằng username/password truyền thống
  const persistSession = useCallback((data: LoginResponse) => {
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_info", JSON.stringify(data.user));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data: LoginResponse = await fetcher("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    persistSession(data);
  }, [persistSession]);

  // Đăng nhập bằng Google OAuth 2.0 — redirect sang Google
  const loginWithGoogle = useCallback(() => {
    window.location.href = `${API_URL}/v1/auth/google`;
  }, []);

  // Xử lý callback sau khi Google redirect về
  const handleGoogleCallback = useCallback(async (code: string) => {
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const data: LoginResponse = await fetcher("/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });

    persistSession(data);
  }, [persistSession]);

  // Đăng xuất
  const logout = useCallback(async () => {
    try {
      await fetcher("/v1/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Đăng xuất thất bại - Không thể kết nối đến máy chủ ");
      throw error;
    }

    setToken(null);
    setUser(null);
    clearAccessToken();
    localStorage.removeItem("user_info");
    window.location.href = "/login";
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("user_info", JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        loginWithGoogle,
        handleGoogleCallback,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
}
