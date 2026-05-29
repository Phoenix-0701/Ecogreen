"use client";

import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Shield,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
  UserCheck,
  Fingerprint
} from "lucide-react";
import { useAuth } from "@/features/auth/auth.context";
import { getMyProfile, updateMyProfile } from "@/services/user.service";

export function ProfileView() {
  const { user, updateUser } = useAuth();
  
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [userId, setUserId] = useState(user?.User_ID || "");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  const showNotification = (type: "success" | "error", title: string, message: string) => {
    setToast({ show: true, type, title, message });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    let mounted = true;
    getMyProfile()
      .then((res: any) => {
        if (!mounted) return;
        const profile = res.data || res;
        if (profile) {
          setFullName(profile.full_name || "");
          setUsername(profile.username || "");
          setEmail(profile.email || "");
          setUserId(profile.User_ID || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Lỗi tải thông tin cá nhân:", err);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showNotification("error", "Lỗi nhập liệu", "Tên đăng nhập không được để trống.");
      return;
    }
    
    setSaving(true);
    try {
      const res = (await updateMyProfile({
        full_name: fullName.trim(),
        username: username.trim(),
      })) as any;
      
      const updatedProfile = res.data || res;
      if (updatedProfile) {
        updateUser(updatedProfile);
        setFullName(updatedProfile.full_name || "");
        setUsername(updatedProfile.username || "");
      }
      
      showNotification(
        "success",
        "Cập nhật thành công",
        "Thông tin hồ sơ cá nhân của bạn đã được cập nhật."
      );
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      showNotification(
        "error",
        "Cập nhật thất bại",
        "Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại kết nối hoặc tên đăng nhập bị trùng."
      );
    } finally {
      setSaving(false);
    }
  };

  // Get initials for profile avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(fullName || username || "User");

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[2rem] bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-[#5d6c63]">
          <Loader2 className="size-4 animate-spin" />
          Đang tải thông tin cá nhân...
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <section className="profile-header">
        <div className="profile-header-left">
          <span className="profile-badge-pill">
            <User size={13} /> Hồ sơ cá nhân
          </span>
          <h1 className="profile-title">Thông tin tài khoản</h1>
          <p className="profile-subtitle">
            Cập nhật họ tên và thông tin tài khoản của bạn trên hệ thống EcoGreen.
          </p>
        </div>
      </section>

      {/* Main Form Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar Card */}
        <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] h-fit">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center text-4xl font-extrabold shadow-lg shadow-emerald-500/20 mb-4 border-4 border-slate-50">
            {initials}
          </div>
          <h2 className="text-lg font-bold text-slate-900 text-center truncate max-w-full">
            {fullName || "Người dùng EcoGreen"}
          </h2>
          <p className="text-sm text-slate-400 mt-1">@{username || "username"}</p>
          
          <div className="w-full mt-6 pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-slate-600">
              <Shield className="size-4 text-emerald-600" />
              <span className="text-xs font-semibold">Thành viên quản trị</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <UserCheck className="size-4 text-emerald-600" />
              <span className="text-xs font-semibold">Tài khoản đã kích hoạt</span>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form */}
        <form onSubmit={handleSave} className="md:col-span-2 bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6">
          <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Chi tiết thông tin</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name field */}
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Họ và tên</label>
              <input
                id="full_name"
                type="text"
                placeholder="VD: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
              />
            </div>

            {/* Username field */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Tên đăng nhập</label>
              <input
                id="username"
                type="text"
                placeholder="VD: nv_a"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                required
              />
            </div>

            {/* Email (Disabled) */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Địa chỉ Email</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-3 pl-10 text-sm font-medium text-slate-400 cursor-not-allowed outline-none"
                />
                <Mail className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Liên hệ quản trị viên để thay đổi email đăng nhập.</p>
            </div>

            {/* User ID (Disabled) */}
            <div className="space-y-2">
              <label htmlFor="user_id" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Mã định danh (User ID)</label>
              <div className="relative">
                <input
                  id="user_id"
                  type="text"
                  value={userId}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/80 px-4 py-3 pl-10 text-sm font-mono text-slate-400 cursor-not-allowed outline-none"
                />
                <Fingerprint className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[#0b7a50] px-7 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,122,80,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_12px_24px_rgba(11,122,80,0.28)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex max-w-sm items-start gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-[0_10px_30px_rgba(16,185,129,0.08),0_2px_8px_rgba(0,0,0,0.04)] animate-slide-in-up">
          {toast.type === "success" ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="size-5" />
            </div>
          )}
          <div className="flex-1 pt-0.5">
            <h4 className={`text-sm font-extrabold tracking-tight ${toast.type === "success" ? "text-emerald-900" : "text-red-950"}`}>
              {toast.title}
            </h4>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 flex size-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* ===== Scoped Styles ===== */}
      {/* @ts-ignore */}
      <style jsx global>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-in-up {
          animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .profile-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: inherit;
        }

        /* ===== Header ===== */
        .profile-header {
          background: white;
          border-radius: 24px;
          border: 1.5px solid #e2e8f0;
          padding: 1.75rem 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .profile-header-left {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .profile-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.75rem;
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 1px solid rgba(16, 185, 129, 0.15);
          background: rgba(16, 185, 129, 0.08);
          color: #10b981;
          width: fit-content;
        }
        .profile-title {
          font-size: 1.875rem;
          font-weight: 850;
          color: #0f172a;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .profile-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
