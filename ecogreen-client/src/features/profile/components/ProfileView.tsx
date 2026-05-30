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
  Fingerprint,
  Clock,
  Cpu,
  Activity,
  Lock,
  Languages,
  Eye,
  EyeOff,
  Settings,
  Key,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth.context";
import { getMyProfile, updateMyProfile } from "@/services/user.service";
import { useLanguage } from "@/context/LanguageContext";

export function ProfileView() {
  const { user, updateUser } = useAuth();
  const { t, changeLanguage } = useLanguage();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"general" | "preferences" | "security" | "activity">("general");

  // Profile Form State
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [userId, setUserId] = useState(user?.User_ID || "");
  
  // Custom Avatar Emoji State
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // Preference State
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [refreshInterval, setRefreshInterval] = useState<number>(5);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<string>("Nhà kính A (Cây rau)");

  // Password / Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // UI Loaders and Notifications
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  // Predefined Custom Emojis for Smart Farm Profile
  const plantAvatars = [
    { id: "sprout", emoji: "🌱", label: t('profile.avatar.sprout', "Mầm non") },
    { id: "tree", emoji: "🌳", label: t('profile.avatar.tree', "Cây lớn") },
    { id: "flower", emoji: "🌸", label: t('profile.avatar.flower', "Hoa tươi") },
    { id: "sun", emoji: "☀️", label: t('profile.avatar.sun', "Mặt trời") },
    { id: "leaf", emoji: "🍃", label: t('profile.avatar.leaf', "Lá xanh") },
    { id: "apple", emoji: "🍎", label: t('profile.avatar.apple', "Trái cây") },
    { id: "tomato", emoji: "🍅", label: t('profile.avatar.tomato', "Cà chua") },
    { id: "farmer", emoji: "🧑‍🌾", label: t('profile.avatar.farmer', "Nông dân") },
  ];

  // Prepopulated activity logs for the user
  const activities = [
    { id: 1, action: t('profile.activityLog.login', "Đăng nhập hệ thống"), ip: "192.168.1.14", time: t('profile.activityLog.today', "Hôm nay") + ", 12:33", status: "success" },
    { id: 2, action: t('profile.activityLog.updateThresholds', "Cập nhật ngưỡng nhiệt độ"), ip: "192.168.1.14", time: t('profile.activityLog.yesterday', "Hôm qua") + ", 18:45", status: "success" },
    { id: 3, action: t('profile.activityLog.manualWatering', "Kích hoạt tưới nước thủ công"), ip: "192.168.1.14", time: "28/05/2026, 09:15", status: "success" },
    { id: 4, action: t('profile.activityLog.changeSettings', "Thay đổi cài đặt thông báo"), ip: "192.168.1.14", time: "26/05/2026, 14:20", status: "success" },
    { id: 5, action: t('profile.activityLog.loginFailed', "Đăng nhập thất bại (Sai mật khẩu)"), ip: "192.168.1.25", time: "25/05/2026, 21:10", status: "failed" },
  ];

  const showNotification = (type: "success" | "error", title: string, message: string) => {
    setToast({ show: true, type, title, message });
  };

  // Toast auto-clear
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Load profile and preferences on mount
  useEffect(() => {
    let mounted = true;

    // Fetch user details
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
        if (mounted) setLoading(false);
      });

    // Fetch preferences from LocalStorage
    const savedAvatar = localStorage.getItem("user_avatar_emoji");
    if (savedAvatar) setSelectedAvatar(savedAvatar);

    const savedUnit = localStorage.getItem("pref_temp_unit") as "C" | "F";
    if (savedUnit) setTempUnit(savedUnit);
    
    const savedLang = localStorage.getItem("pref_language") as "vi" | "en";
    if (savedLang) setLanguage(savedLang);
    
    const savedInterval = localStorage.getItem("pref_refresh_interval");
    if (savedInterval) setRefreshInterval(Number(savedInterval));

    const savedGreenhouse = localStorage.getItem("pref_default_greenhouse");
    if (savedGreenhouse) setSelectedGreenhouse(savedGreenhouse);

    const saved2FA = localStorage.getItem("security_2fa_enabled");
    if (saved2FA) setTwoFactorEnabled(saved2FA === "true");

    return () => {
      mounted = false;
    };
  }, []);

  // Save general profile settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showNotification("error", t('profile.notification.errorTitle', "Lỗi nhập liệu"), t('profile.notification.usernameRequired', "Tên đăng nhập không được để trống."));
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
        t('profile.notification.saveSuccessTitle', "Cập nhật thành công"),
        t('profile.notification.saveSuccessMsg', "Thông tin hồ sơ cá nhân của bạn đã được cập nhật.")
      );
    } catch (err) {
      console.error("Lỗi cập nhật hồ sơ:", err);
      showNotification(
        "error",
        t('profile.notification.saveFailTitle', "Cập nhật thất bại"),
        t('profile.notification.saveFailMsg', "Không thể cập nhật hồ sơ. Vui lòng kiểm tra lại kết nối hoặc tên đăng nhập bị trùng.")
      );
    } finally {
      setSaving(false);
    }
  };

  // Save application preferences
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("pref_temp_unit", tempUnit);
    localStorage.setItem("pref_refresh_interval", String(refreshInterval));
    localStorage.setItem("pref_default_greenhouse", selectedGreenhouse);
    
    changeLanguage(language);
    
    showNotification("success", t('profile.notification.savePrefTitle', "Đã lưu cài đặt"), t('profile.notification.savePrefMsg', "Tùy chỉnh hệ thống của bạn đã được lưu lại thành công."));
  };

  // Save new password (mocked)
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showNotification("error", t('profile.notification.missingPasswordTitle', "Thiếu thông tin"), t('profile.notification.missingPasswordMsg', "Vui lòng nhập mật khẩu hiện tại."));
      return;
    }
    if (newPassword.length < 6) {
      showNotification("error", t('profile.notification.weakPasswordTitle', "Mật khẩu yếu"), t('profile.notification.weakPasswordMsg', "Mật khẩu mới phải từ 6 ký tự trở lên."));
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("error", t('profile.notification.passwordMismatchTitle', "Mật khẩu không khớp"), t('profile.notification.passwordMismatchMsg', "Xác nhận mật khẩu mới không trùng khớp."));
      return;
    }

    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showNotification("success", t('profile.notification.passwordChangedTitle', "Đổi mật khẩu thành công"), t('profile.notification.passwordChangedMsg', "Mật khẩu tài khoản đã được thay đổi thành công!"));
    }, 1000);
  };

  // Enable/Disable mock 2FA
  const handleToggle2FA = () => {
    const nextState = !twoFactorEnabled;
    setTwoFactorEnabled(nextState);
    localStorage.setItem("security_2fa_enabled", String(nextState));
    showNotification(
      "success",
      nextState ? t('profile.notification.toggle2FaSuccessTitle', "Bật 2FA thành công") : t('profile.notification.toggle2FaDisabledTitle', "Tắt 2FA thành công"),
      nextState ? t('profile.notification.toggle2FaSuccessMsg', "Bảo mật hai lớp qua điện thoại đã được kích hoạt.") : t('profile.notification.toggle2FaDisabledMsg', "Hệ thống bảo mật hai lớp đã bị tắt.")
    );
  };

  // Select custom emoji avatar
  const handleSelectAvatar = (emoji: string) => {
    setSelectedAvatar(emoji);
    localStorage.setItem("user_avatar_emoji", emoji);
    window.dispatchEvent(new Event("ecogreen_avatar_updated"));
    setShowAvatarSelector(false);
    showNotification("success", t('profile.notification.avatarTitle', "Thay đổi ảnh đại diện"), t('profile.notification.avatarMsg', "Ảnh đại diện mới đã được lưu thành công."));
  };

  // Get initials for profile avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials = getInitials(fullName || username || "User");

  // Real-time password strength computation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: t('profile.form.pwdStrengthEmpty', "Chưa nhập"), color: "bg-slate-200", textColor: "text-slate-400", width: "w-0", score: 0 };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { label: t('profile.form.pwdStrengthWeak', "Yếu"), color: "bg-red-500", textColor: "text-red-500", width: "w-1/3", score };
    } else if (score <= 4) {
      return { label: t('profile.form.pwdStrengthMedium', "Trung bình"), color: "bg-yellow-500", textColor: "text-yellow-600", width: "w-2/3", score };
    } else {
      return { label: t('profile.form.pwdStrengthStrong', "Mạnh"), color: "bg-emerald-500", textColor: "text-emerald-600", width: "w-full", score };
    }
  };

  const pwdStrength = getPasswordStrength(newPassword);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center rounded-[2rem] bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3 text-sm font-medium text-[#5d6c63]">
          <Loader2 className="size-4 animate-spin" />
          {t('profile.loading', "Đang tải thông tin cá nhân...")}
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container w-full space-y-6">
      {/* Header Banner */}
      <section className="profile-header">
        <div className="profile-header-left">
          <span className="profile-badge-pill">
            <User size={13} /> {t('profile.badge', "Hồ sơ cá nhân")}
          </span>
          <h1 className="profile-title">{t('profile.title', "Thông tin tài khoản")}</h1>
          <p className="profile-subtitle">
            {t('profile.subtitle', "Quản lý thông tin cá nhân, cấu hình hệ thống và thiết lập bảo mật của bạn.")}
          </p>
        </div>
      </section>

      {/* Stats Grid at the top */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 flex items-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Shield className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('profile.role', "Vai trò")}</span>
            <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{t('profile.adminRole', "Quản trị viên")}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 flex items-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Cpu className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('profile.monitoredDevices', "Thiết bị giám sát")}</span>
            <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{t('profile.devicesCount', "6 Cảm biến")}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 flex items-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('profile.activation', "Kích hoạt")}</span>
            <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">{t('profile.activationValue', "98 ngày trước")}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-[20px] p-4 flex items-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Activity className="size-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('profile.system', "Hệ thống")}</span>
            <span className="text-sm font-extrabold text-emerald-600 mt-0.5 block flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t('common.stable', "Ổn định")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Split Area */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Profile Card & Actions */}
        <div className="md:col-span-4 space-y-6">
          
          {/* Avatar Card */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 flex flex-col items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
            {/* Background design accents */}
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-r from-emerald-500/10 to-green-500/5 z-0" />
            
            <div className="relative group z-10 mt-4">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center text-4xl font-extrabold shadow-lg shadow-emerald-500/20 mb-4 border-4 border-white overflow-hidden relative cursor-pointer">
                {selectedAvatar ? (
                  <span className="text-5xl select-none leading-none">{selectedAvatar}</span>
                ) : (
                  initials
                )}
                
                <div 
                  onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                  className="absolute inset-0 bg-black/45 text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-200"
                >
                  <Sparkles className="size-4 mb-1 animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">{t('profile.avatar.change', "Đổi ảnh")}</span>
                </div>
              </div>
            </div>

            {/* Avatar Selector Grid Dropdown */}
            {showAvatarSelector && (
              <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 mb-4 z-10 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700">{t('profile.avatar.select', "Chọn ảnh đại diện nông trại")}</span>
                  <button 
                    onClick={() => setShowAvatarSelector(false)}
                    className="text-slate-400 hover:text-slate-600 transition"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {plantAvatars.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectAvatar(item.emoji)}
                      type="button"
                      className="h-11 w-11 rounded-xl bg-white border border-slate-150 hover:border-emerald-500 hover:scale-105 active:scale-95 text-2xl flex items-center justify-center shadow-sm transition"
                      title={item.label}
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-lg font-extrabold text-slate-900 text-center truncate max-w-full z-10">
              {fullName || t('profile.defaultUser', "Người dùng EcoGreen")}
            </h2>
            <p className="text-sm text-slate-400 mt-1 z-10">@{username || "username"}</p>
            
            <div className="w-full mt-6 pt-6 border-t border-slate-100 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                <Shield className="size-4.5 text-emerald-600 bg-emerald-50 p-0.5 rounded" />
                <span className="text-xs font-bold">{t('profile.avatar.adminMember', "Thành viên quản trị")}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600">
                <UserCheck className="size-4.5 text-emerald-600 bg-emerald-50 p-0.5 rounded" />
                <span className="text-xs font-bold">{t('profile.avatar.activatedAccount', "Tài khoản đã kích hoạt")}</span>
              </div>
            </div>
          </div>

          {/* Security Checklist Widget */}
          <div className="bg-white border border-slate-200/80 rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{t('profile.securityCheck.title', "Trạng thái bảo mật")}</h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t('profile.securityCheck.email', "Xác thực Email")}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('profile.securityCheck.emailDesc', "Địa chỉ email đã được xác minh thành công.")}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                {twoFactorEnabled ? (
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t('profile.securityCheck.twoFactor', "Bảo mật hai lớp (2FA)")}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {twoFactorEnabled ? t('profile.securityCheck.twoFactorEnabled', "Kích hoạt giúp tài khoản an toàn tối đa.") : t('profile.securityCheck.twoFactorDisabled', "Chưa kích hoạt. Nên bật để bảo mật tốt hơn.")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{t('profile.securityCheck.deviceLock', "Khóa liên kết thiết bị")}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('profile.securityCheck.deviceLockDesc', "Mạch ESP32 đang sử dụng giao thức an toàn SSL/TLS.")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tab View & Forms */}
        <div className="md:col-span-8 bg-white border border-slate-200/80 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
          
          {/* Tabs Navigation Header */}
          <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-none bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`px-5 py-4.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                activeTab === "general"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t('profile.tabs.general', "Thông tin chung")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`px-5 py-4.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                activeTab === "preferences"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t('profile.tabs.preferences', "Tùy chỉnh hệ thống")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`px-5 py-4.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                activeTab === "security"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t('profile.tabs.security', "Bảo mật & Mật khẩu")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activity")}
              className={`px-5 py-4.5 text-xs font-bold uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                activeTab === "activity"
                  ? "border-emerald-600 text-emerald-700 bg-white"
                  : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t('profile.tabs.activity', "Lịch sử hoạt động")}
            </button>
          </div>

          {/* Tab Content Panels */}
          <div className="p-6">
            
            {/* 1. GENERAL INFORMATION TAB */}
            {activeTab === "general" && (
              <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900">{t('profile.form.generalTitle', "Thông tin cá nhân")}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t('profile.form.generalDesc', "Cập nhật thông tin cơ bản để hiển thị trên hệ thống.")}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label htmlFor="full_name" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.fullName', "Họ và tên")}</label>
                    <input
                      id="full_name"
                      type="text"
                      placeholder={t('profile.form.fullNamePlaceholder', "VD: Phạm Công Vỡ")}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-350 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.username', "Tên đăng nhập")}</label>
                    <input
                      id="username"
                      type="text"
                      placeholder={t('profile.form.usernamePlaceholder', "VD: vopham")}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-355 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.email', "Địa chỉ Email")}</label>
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
                    <p className="text-[10px] text-slate-450 mt-1">{t('profile.form.emailDesc', "Liên hệ quản trị viên để thay đổi địa chỉ email.")}</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="user_id" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.userId', "Mã định danh (User ID)")}</label>
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
                    {saving ? t('common.saving', "Đang lưu...") : t('profile.form.saveChanges', "Lưu thay đổi")}
                  </button>
                </div>
              </form>
            )}

            {/* 2. SYSTEM PREFERENCES TAB */}
            {activeTab === "preferences" && (
              <form onSubmit={handleSavePreferences} className="space-y-6 animate-fade-in">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-extrabold text-slate-900">{t('profile.form.prefTitle', "Tùy chỉnh hệ thống")}</h3>
                  <p className="text-xs text-slate-400 mt-1">{t('profile.form.prefDesc', "Cấu hình các cài đặt hiển thị cá nhân cho tài khoản.")}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.tempUnit', "Đơn vị đo nhiệt độ")}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTempUnit("C")}
                        className={`py-2.5 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                          tempUnit === "C"
                            ? "border-emerald-600 bg-emerald-50/50 text-emerald-700"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {t('profile.form.tempUnitC', "Nhiệt độ °C (Celsius)")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempUnit("F")}
                        className={`py-2.5 rounded-xl border text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                          tempUnit === "F"
                            ? "border-emerald-600 bg-emerald-50/50 text-emerald-700"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        {t('profile.form.tempUnitF', "Nhiệt độ °F (Fahrenheit)")}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.langLabel', "Ngôn ngữ hiển thị")}</label>
                    <div className="relative">
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as "vi" | "en")}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50 appearance-none"
                      >
                        <option value="vi">{t('profile.form.langVi', "Tiếng Việt (Mặc định)")}</option>
                        <option value="en">{t('profile.form.langEn', "English (Tiếng Anh)")}</option>
                      </select>
                      <Languages className="absolute right-3.5 top-3.5 size-4 text-slate-450 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.greenhouseLabel', "Khu vực nhà kính mặc định")}</label>
                    <div className="relative">
                      <select
                        value={selectedGreenhouse}
                        onChange={(e) => setSelectedGreenhouse(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50 appearance-none"
                      >
                        <option value="Nhà kính A (Cây rau)">{t('profile.form.greenhouseA', "Nhà kính A (Khu vực cây rau)")}</option>
                        <option value="Nhà kính B (Cây ăn quả)">{t('profile.form.greenhouseB', "Nhà kính B (Khu vực ăn quả)")}</option>
                        <option value="Nhà kính C (Ươm cây giống)">{t('profile.form.greenhouseC', "Nhà kính C (Ươm giống hoa)")}</option>
                      </select>
                      <Settings className="absolute right-3.5 top-3.5 size-4 text-slate-450 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.intervalLabel', "Tần suất làm mới dữ liệu")}</label>
                    <div className="relative">
                      <select
                        value={refreshInterval}
                        onChange={(e) => setRefreshInterval(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50 appearance-none"
                      >
                        <option value={2}>{t('profile.form.interval2s', "Mỗi 2 giây (Cực nhanh)")}</option>
                        <option value={5}>{t('profile.form.interval5s', "Mỗi 5 giây (Khuyên dùng)")}</option>
                        <option value={15}>{t('profile.form.interval15s', "Mỗi 15 giây")}</option>
                        <option value={30}>{t('profile.form.interval30s', "Mỗi 30 giây")}</option>
                      </select>
                      <Clock className="absolute right-3.5 top-3.5 size-4 text-slate-450 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-[#0b7a50] px-7 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,122,80,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_12px_24px_rgba(11,122,80,0.28)]"
                  >
                    <Save className="size-4" />
                    {t('profile.form.saveSettings', "Lưu thiết lập")}
                  </button>
                </div>
              </form>
            )}

            {/* 3. SECURITY & PASSWORD TAB */}
            {activeTab === "security" && (
              <div className="space-y-6 animate-fade-in">
                <form onSubmit={handleSavePassword} className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-extrabold text-slate-900">{t('profile.form.secTitle', "Thay đổi mật khẩu")}</h3>
                    <p className="text-xs text-slate-400 mt-1">{t('profile.form.secDesc', "Đảm bảo mật khẩu của bạn có ít nhất 6 ký tự và có tính bảo mật cao.")}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Current Password */}
                    <div className="space-y-2">
                      <label htmlFor="curr_pwd" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.currentPassword', "Mật khẩu hiện tại")}</label>
                      <div className="relative">
                        <input
                          id="curr_pwd"
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder={t('profile.form.currPwdPlaceholder', "Nhập mật khẩu đang sử dụng")}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                        />
                        <Lock className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* New Password & Strength Meter */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="new_pwd" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.newPassword', "Mật khẩu mới")}</label>
                        <div className="relative">
                          <input
                            id="new_pwd"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t('profile.form.newPwdPlaceholder', "Tối thiểu 6 ký tự")}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                          />
                          <Key className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="conf_pwd" className="text-xs font-bold uppercase tracking-wider text-slate-500 block">{t('profile.form.confirmPassword', "Xác nhận mật khẩu mới")}</label>
                        <div className="relative">
                          <input
                            id="conf_pwd"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('profile.form.confPwdPlaceholder', "Nhập lại mật khẩu mới")}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pl-10 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-50"
                          />
                          <Key className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition"
                          >
                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Strength Indicator */}
                    {newPassword && (
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5 transition">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-500">{t('profile.form.pwdComplexity', "Độ phức tạp mật khẩu:")}</span>
                          <span className={`font-extrabold ${pwdStrength.textColor}`}>{pwdStrength.label}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full ${pwdStrength.color} ${pwdStrength.width} transition-all duration-300`} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-2 rounded-xl bg-[#0b7a50] px-7 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(11,122,80,0.22)] transition hover:translate-y-[-1px] hover:shadow-[0_12px_24px_rgba(11,122,80,0.28)]"
                    >
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                      {saving ? t('common.saving', "Đang lưu...") : t('profile.form.updatePassword', "Cập nhật mật khẩu")}
                    </button>
                  </div>
                </form>

                {/* 2-Factor Authentication Widget */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center justify-between bg-slate-50/50 border border-slate-100 rounded-2xl p-4.5">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                        <Smartphone className="size-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{t('profile.securityCheck.twoFactor', "Xác thực hai yếu tố (2FA)")}</h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {t('profile.securityCheck.twoFactorDesc', "Tăng cường bảo vệ tài khoản bằng việc yêu cầu mã xác nhận OTP từ ứng dụng xác thực trên điện thoại khi đăng nhập.")}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggle2FA}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        twoFactorEnabled ? "bg-emerald-600" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block size-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          twoFactorEnabled ? "translate-x-5.5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ACTIVITY LOGS TAB */}
            {activeTab === "activity" && (
              <div className="space-y-4 animate-fade-in">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">{t('profile.activityLog.title', "Lịch sử đăng nhập & Thao tác")}</h3>
                    <p className="text-xs text-slate-400 mt-1">{t('profile.activityLog.desc', "Danh sách 5 hoạt động gần đây nhất từ tài khoản của bạn.")}</p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full">
                    {t('profile.activityLog.realtime', "Thời gian thực")}
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {activities.map((log) => (
                    <div key={log.id} className="py-3.5 flex items-center justify-between hover:bg-slate-50/30 transition px-1 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          log.status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                        }`}>
                          <Activity size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{log.action}</h4>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Địa chỉ IP: {log.ip}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-450 block">{log.time}</span>
                        <span className={`inline-flex items-center text-[9px] font-bold mt-1 uppercase tracking-wider ${
                          log.status === "success" ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {log.status === "success" ? t('common.success', "Thành công") : t('common.failed', "Thất bại")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Notifications Toast */}
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

      {/* ===== Scoped CSS Animations & Layout Tweaks ===== */}
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
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-slide-in-up {
          animation: slideInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }

        .profile-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: inherit;
        }

        /* ===== Header Section ===== */
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

        /* Hide default scrollbars for tabs */
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
