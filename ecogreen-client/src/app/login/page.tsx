"use client";

import React, { useState } from "react";
import { useAuth } from "@/features/auth/auth.context";
import { useRouter } from "next/navigation";
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Nếu đã đăng nhập → chuyển về dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login({ username, password });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated Background */}
      <div className="login-bg">
        <div className="login-bg-orb login-bg-orb--1" />
        <div className="login-bg-orb login-bg-orb--2" />
        <div className="login-bg-orb login-bg-orb--3" />
        <div className="login-bg-grid" />
      </div>

      {/* Floating particles */}
      <div className="login-particles">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`login-particle login-particle--${i + 1}`}>
            <Leaf size={16} />
          </div>
        ))}
      </div>

      {/* Main Card */}
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">
              <Leaf size={28} strokeWidth={2.5} />
            </div>
            <h1 className="login-title">EcoGreen</h1>
          </div>
          <p className="login-subtitle">
            Hệ thống quản lý nông nghiệp thông minh
          </p>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={loginWithGoogle}
          className="login-google-btn"
          id="google-login-btn"
        >
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span>Đăng nhập bằng Google</span>
        </button>

        {/* Divider */}
        <div className="login-divider">
          <div className="login-divider-line" />
          <span className="login-divider-text">hoặc</span>
          <div className="login-divider-line" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="login-error" id="login-error-message">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 4.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="11" r="0.75" fill="currentColor" />
              </svg>
              {error}
            </div>
          )}

          <div className="login-field">
            <label htmlFor="username" className="login-label">
              Tên đăng nhập
            </label>
            <div className="login-input-wrapper">
              <Mail size={18} className="login-input-icon" />
              <input
                id="username"
                type="text"
                placeholder="Nhập username..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Mật khẩu
            </label>
            <div className="login-input-wrapper">
              <Lock size={18} className="login-input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="login-submit-btn"
            disabled={isSubmitting}
            id="login-submit-btn"
          >
            {isSubmitting ? (
              <Loader2 size={20} className="login-spinner" />
            ) : (
              <>
                Đăng nhập
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="login-footer">
          Được phát triển bởi nhóm <strong>EcoGreen</strong> 🌱
        </p>
      </div>

      <style jsx>{`
        /* ===== Page Layout ===== */
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 1.5rem;
          font-family: 'Inter', 'Segoe UI', sans-serif;
        }

        /* ===== Animated Background ===== */
        .login-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: linear-gradient(135deg, #0a1a0f 0%, #0d2818 25%, #112e1c 50%, #0a1f12 75%, #071510 100%);
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }

        .login-bg-orb--1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #22c55e 0%, transparent 70%);
          top: -15%;
          right: -10%;
          animation: orbFloat1 12s ease-in-out infinite;
        }

        .login-bg-orb--2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #10b981 0%, transparent 70%);
          bottom: -20%;
          left: -10%;
          animation: orbFloat2 15s ease-in-out infinite;
        }

        .login-bg-orb--3 {
          width: 350px;
          height: 350px;
          background: radial-gradient(circle, #34d399 0%, transparent 70%);
          top: 40%;
          left: 50%;
          animation: orbFloat3 10s ease-in-out infinite;
        }

        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(34, 197, 94, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.1); }
          66% { transform: translate(20px, -20px) scale(0.95); }
        }

        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, -30px) scale(1.08); }
          66% { transform: translate(-20px, 40px) scale(0.92); }
        }

        @keyframes orbFloat3 {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, -30px) scale(1.15); }
        }

        /* ===== Floating Particles ===== */
        .login-particles {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
        }

        .login-particle {
          position: absolute;
          color: rgba(34, 197, 94, 0.15);
          animation: particleFloat 20s linear infinite;
        }

        .login-particle--1 { left: 10%; animation-delay: 0s; animation-duration: 25s; }
        .login-particle--2 { left: 25%; animation-delay: -4s; animation-duration: 20s; }
        .login-particle--3 { left: 45%; animation-delay: -8s; animation-duration: 28s; }
        .login-particle--4 { left: 65%; animation-delay: -12s; animation-duration: 22s; }
        .login-particle--5 { left: 80%; animation-delay: -6s; animation-duration: 26s; }
        .login-particle--6 { left: 90%; animation-delay: -16s; animation-duration: 24s; }

        @keyframes particleFloat {
          0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
        }

        /* ===== Login Card ===== */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          padding: 2.5rem;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 0 0 1px rgba(34, 197, 94, 0.05),
            0 20px 60px -12px rgba(0, 0, 0, 0.5),
            0 0 120px -40px rgba(34, 197, 94, 0.15);
          animation: cardAppear 0.6s ease-out;
        }

        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(30px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ===== Header ===== */
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .login-logo-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 24px -4px rgba(34, 197, 94, 0.4);
          animation: logoPulse 3s ease-in-out infinite;
        }

        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 8px 24px -4px rgba(34, 197, 94, 0.4); }
          50% { box-shadow: 0 8px 32px -2px rgba(34, 197, 94, 0.6); }
        }

        .login-title {
          font-size: 1.75rem;
          font-weight: 800;
          background: linear-gradient(135deg, #4ade80, #22c55e, #16a34a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.45);
          letter-spacing: 0.01em;
        }

        /* ===== Google Button ===== */
        .login-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .login-google-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.3);
        }

        .login-google-btn:active {
          transform: translateY(0);
        }

        /* ===== Divider ===== */
        .login-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.5rem 0;
        }

        .login-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
        }

        .login-divider-text {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* ===== Form ===== */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          font-size: 0.85rem;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .login-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          color: rgba(255, 255, 255, 0.25);
          pointer-events: none;
          transition: color 0.2s;
        }

        .login-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.9rem;
          outline: none;
          transition: all 0.25s ease;
        }

        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }

        .login-input:focus {
          border-color: rgba(34, 197, 94, 0.5);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }

        .login-input:focus ~ .login-input-icon,
        .login-input:focus + .login-input-icon {
          color: #22c55e;
        }

        .login-input-wrapper:focus-within .login-input-icon {
          color: #22c55e;
        }

        .login-eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.25);
          cursor: pointer;
          padding: 4px;
          display: flex;
          transition: color 0.2s;
        }

        .login-eye-btn:hover {
          color: rgba(255, 255, 255, 0.6);
        }

        /* ===== Submit Button ===== */
        .login-submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.8rem 1.5rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.25rem;
          box-shadow: 0 4px 16px -4px rgba(34, 197, 94, 0.4);
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px -4px rgba(34, 197, 94, 0.5);
          background: linear-gradient(135deg, #4ade80, #22c55e);
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ===== Footer ===== */
        .login-footer {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.25);
        }

        .login-footer strong {
          color: rgba(34, 197, 94, 0.6);
        }

        /* ===== Responsive ===== */
        @media (max-width: 480px) {
          .login-card {
            padding: 2rem 1.5rem;
          }
          .login-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
