"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { User, LoginPayload, LoginResponse } from "@/types";
import { fetcher, API_URL } from "@/services/api";

// ============ GOOGLE CLIENT ID ============
// Thay bằng Google Client ID thật từ Google Cloud Console
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  loginWithGoogle: () => void;
  handleGoogleCallback: (code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo - đọc token từ localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("user_info");

    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("user_info");
      }
    }
    setIsLoading(false);
  }, []);

  // Đăng nhập bằng username/password truyền thống
  const login = useCallback(async (payload: LoginPayload) => {
    const data: LoginResponse = await fetcher("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_info", JSON.stringify(data.user));
  }, []);

  // Đăng nhập bằng Google OAuth 2.0 — redirect sang Google
  const loginWithGoogle = useCallback(() => {
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = "openid email profile";
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent(scope)}` +
      `&access_type=offline` +
      `&prompt=consent`;

    window.location.href = googleAuthUrl;
  }, []);

  // Xử lý callback sau khi Google redirect về
  const handleGoogleCallback = useCallback(async (code: string) => {
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const data: LoginResponse = await fetcher("/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user_info", JSON.stringify(data.user));
  }, []);

  // Đăng xuất
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
    window.location.href = "/login";
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
