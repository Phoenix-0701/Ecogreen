"use client";
import React from "react";
import { useAuth } from "@/features/auth/auth.context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Leaf, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const { loginWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

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

      {/* Main Glassmorphism Card */}
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <Link href="/" className="login-logo block hover:opacity-95 transition-opacity">
            <div className="flex items-center justify-center gap-3">
              <div className="login-logo-icon">
                <Leaf size={32} strokeWidth={2.5} />
              </div>
              <h1 className="login-title">EcoGreen</h1>
            </div>
          </Link>
          <p className="login-subtitle">
            Hệ thống quản lý nông nghiệp thông minh
          </p>
        </div>

        {/* Description/Welcome section to provide visual balance */}
        <div className="login-intro">
          <p className="login-intro-text">
            Chào mừng bạn đến với EcoGreen. Hệ thống thông minh giúp bạn tự động hóa chu kỳ tưới tiêu, theo dõi thời tiết thực tế và tối ưu hóa năng suất cây trồng.
          </p>
          <div className="login-intro-divider" />
          <p className="login-intro-action">
            Vui lòng đăng nhập để truy cập trang quản trị hệ thống:
          </p>
        </div>

        {/* Google OAuth Button */}
        <div className="login-action-container">
          <button
            type="button"
            onClick={loginWithGoogle}
            className="login-google-btn"
            id="google-login-btn"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" className="google-icon">
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
            <span>Đăng nhập với Google</span>
          </button>
        </div>

        {/* Security / Trust notice */}
        <div className="login-security-notice">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Bảo mật bằng giao thức Google OAuth 2.0</span>
        </div>

        {/* Footer */}
        <p className="login-footer">
          Được phát triển bởi nhóm <strong>EcoGreen</strong> 🌱
        </p>
      </div>

      <style>{`
        /* ===== Page Layout ===== */
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 2rem 1.5rem;
          font-family: 'Plus Jakarta Sans', 'Inter', 'Segoe UI', sans-serif;
        }

        /* ===== Animated Background ===== */
        .login-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background: linear-gradient(135deg, #09130d 0%, #0d2818 25%, #102e1b 50%, #0c2013 75%, #05140d 100%);
        }

        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.35;
        }

        .login-bg-orb--1 {
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, #10b981 0%, transparent 70%);
          top: -20%;
          right: -10%;
          animation: orbFloat1 16s ease-in-out infinite;
        }

        .login-bg-orb--2 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #059669 0%, transparent 70%);
          bottom: -25%;
          left: -15%;
          animation: orbFloat2 20s ease-in-out infinite;
        }

        .login-bg-orb--3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #34d399 0%, transparent 70%);
          top: 35%;
          left: 45%;
          animation: orbFloat3 12s ease-in-out infinite;
        }

        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(16, 185, 129, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-50px, 40px) scale(1.08); }
          66% { transform: translate(30px, -30px) scale(0.96); }
        }

        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(60px, -40px) scale(1.05); }
          66% { transform: translate(-30px, 50px) scale(0.93); }
        }

        @keyframes orbFloat3 {
          0%, 100% { transform: translate(-50%, 0) scale(1); }
          50% { transform: translate(-50%, -40px) scale(1.1); }
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
          color: rgba(16, 185, 129, 0.12);
          animation: particleFloat 24s linear infinite;
        }

        .login-particle--1 { left: 12%; animation-delay: 0s; animation-duration: 26s; }
        .login-particle--2 { left: 28%; animation-delay: -5s; animation-duration: 21s; }
        .login-particle--3 { left: 42%; animation-delay: -9s; animation-duration: 30s; }
        .login-particle--4 { left: 63%; animation-delay: -13s; animation-duration: 23s; }
        .login-particle--5 { left: 78%; animation-delay: -7s; animation-duration: 27s; }
        .login-particle--6 { left: 88%; animation-delay: -17s; animation-duration: 25s; }

        @keyframes particleFloat {
          0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) rotate(360deg); opacity: 0; }
        }

        /* ===== Login Card (Balanced & Spaced) ===== */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 3.25rem 2.75rem;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow:
            0 0 0 1px rgba(16, 185, 129, 0.06),
            0 24px 70px -15px rgba(0, 0, 0, 0.6),
            0 0 140px -40px rgba(16, 185, 129, 0.18);
          animation: cardAppear 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        @keyframes cardAppear {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ===== Header ===== */
        .login-header {
          text-align: center;
          margin-bottom: 2.25rem;
          width: 100%;
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          margin-bottom: 0.85rem;
        }

        .login-logo-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #10b981, #047857);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 10px 28px -4px rgba(16, 185, 129, 0.45);
          animation: logoPulse 3s ease-in-out infinite;
        }

        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 10px 28px -4px rgba(16, 185, 129, 0.45); transform: scale(1); }
          50% { box-shadow: 0 10px 36px -2px rgba(16, 185, 129, 0.65); transform: scale(1.02); }
        }

        .login-title {
          font-size: 2.1rem;
          font-weight: 850;
          background: linear-gradient(135deg, #34d399, #10b981, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.03em;
        }

        .login-subtitle {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.5);
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        /* ===== Welcome Description ===== */
        .login-intro {
          text-align: center;
          margin-bottom: 2.25rem;
          width: 100%;
        }

        .login-intro-text {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        .login-intro-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1) 20%, rgba(255, 255, 255, 0.1) 80%, transparent);
          margin: 1.25rem auto;
          width: 90%;
        }

        .login-intro-action {
          font-size: 0.85rem;
          color: rgba(16, 185, 129, 0.8);
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        /* ===== Action Container ===== */
        .login-action-container {
          width: 100%;
          margin-bottom: 1.75rem;
        }

        /* ===== Premium Google Button ===== */
        .login-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          padding: 0.95rem 1.5rem;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.95);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .login-google-btn:hover {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(16, 185, 129, 0.45);
          transform: translateY(-2px);
          box-shadow: 
            0 10px 24px -6px rgba(0, 0, 0, 0.3),
            0 0 20px -2px rgba(16, 185, 129, 0.25);
        }

        .login-google-btn:active {
          transform: translateY(0);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .google-icon {
          flex-shrink: 0;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
        }

        /* ===== Security Notice ===== */
        .login-security-notice {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.35);
          font-weight: 500;
          letter-spacing: 0.02em;
          margin-bottom: 0.5rem;
        }

        /* ===== Footer ===== */
        .login-footer {
          text-align: center;
          margin-top: 2rem;
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.3);
        }

        .login-footer strong {
          color: rgba(16, 185, 129, 0.75);
          font-weight: 700;
        }

        /* ===== Responsive ===== */
        @media (max-width: 480px) {
          .login-card {
            padding: 2.75rem 2rem;
          }
          .login-title {
            font-size: 1.8rem;
          }
          .login-logo-icon {
            width: 46px;
            height: 46px;
          }
          .login-google-btn {
            padding: 0.85rem 1.25rem;
            font-size: 0.95rem;
          }
        }
      `}</style>
    </div>
  );
}
