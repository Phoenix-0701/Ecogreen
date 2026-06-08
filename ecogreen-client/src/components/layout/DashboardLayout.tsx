"use client";

import { useState, useEffect, Suspense } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Bell,
  BrainCircuit,
  CalendarClock,
  Cpu,
  HelpCircle,
  History,
  LayoutDashboard,
  Leaf,
  LineChart,
  LogOut,
  Menu,
  ScrollText,
  Search,
  Settings2,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth.context";
import { useLanguage } from "@/context/LanguageContext";
import { getMyProfile } from "@/services/user.service";
import { VoiceAssistantButton } from "@/features/dashboard/components/VoiceAssistantButton";

type NavItem = {
  key: string;
  href: string;
  label: string;
  title: string;
  icon: ReactNode;
  aliases?: string[];
};

const navItems: NavItem[] = [
  {
    key: "DASHBOARD",
    href: "/dashboard",
    label: "Tổng quan",
    title: "Tổng quan",
    icon: <LayoutDashboard size={20} />,
  },
  {
    key: "DEVICE",
    href: "/dashboard/devices",
    label: "Quản lý thiết bị",
    title: "Quản lý thiết bị",
    icon: <Cpu size={20} />,
  },
  {
    key: "CHART",
    href: "/dashboard/chart",
    label: "Biểu đồ",
    title: "Biểu đồ",
    icon: <LineChart size={20} />,
  },
  {
    key: "HISTORY",
    href: "/dashboard/history",
    label: "Lịch sử dữ liệu",
    title: "Lịch sử dữ liệu",
    icon: <History size={20} />,
  },
  {
    key: "SCHEDULE",
    href: "/schedule",
    label: "Lịch trình tưới",
    title: "Lịch trình tưới",
    icon: <CalendarClock size={20} />,
    aliases: ["/dashboard/schedule"],
  },
  {
    key: "THRESHOLDS",
    href: "/thresholds",
    label: "Ngưỡng tưới & Logic",
    title: "Ngưỡng tưới & Logic",
    icon: <Settings2 size={20} />,
  },
  {
    key: "NOTIFICATION",
    href: "/dashboard/notifications",
    label: "Cấu hình thông báo",
    title: "Cấu hình thông báo",
    icon: <Bell size={20} />,
  },
  {
    key: "LOG",
    href: "/dashboard/logs",
    label: "Nhật ký hoạt động",
    title: "Nhật ký hoạt động",
    icon: <ScrollText size={20} />,
  },
  {
    key: "SMART LOGIC",
    href: "/smart-logic",
    label: "Logic thông minh",
    title: "Logic thông minh",
    icon: <BrainCircuit size={20} />,
    aliases: ["/dashboard/smart-logic"],
  },
  {
    key: "PROFILE",
    href: "/profile",
    label: "Thông tin cá nhân",
    title: "Thông tin cá nhân",
    icon: <User size={20} />,
  },
];

function RealtimeClock() {
  const [time, setTime] = useState<Date | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: initialize clock on client mount
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return null;

  const locale = language === "en" ? "en-US" : "vi-VN";

  return (
    <div className="hidden sm:flex flex-col items-end px-3 mr-1 text-white/90">
      <span className="text-[0.95rem] font-bold tracking-wider leading-tight font-sans bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
        {time.toLocaleTimeString(locale, { hour12: false })}
      </span>
      <span className="text-[0.65rem] opacity-70 uppercase tracking-widest font-medium">
        {time.toLocaleDateString(locale)}
      </span>
    </div>
  );
}

interface DashboardLayoutProps {
  children: ReactNode;
  activeMenu?: string;
  pageTitle?: string;
}

function TokenCapturer() {
  const searchParams = useSearchParams();
  const { updateUser } = useAuth();

  useEffect(() => {
    const tokenFromUrl = searchParams?.get("token");
    if (tokenFromUrl) {
      localStorage.setItem("access_token", tokenFromUrl);

      // Fetch user profile to populate Context
      getMyProfile()
        .then((res: any) => {
          const profile = res.data || res;
          if (profile) {
            updateUser(profile);
          }
        })
        .catch(console.error);

      // Clean up the URL by removing ?token=...
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [searchParams, updateUser]);

  return null;
}

export default function DashboardLayout({
  children,
  activeMenu,
  pageTitle,
}: DashboardLayoutProps) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, logout, updateUser } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const { t: contextT } = useLanguage();
  const [avatarEmoji, setAvatarEmoji] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: read localStorage after hydration
    setMounted(true);
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    const updateAvatar = () => {
      setAvatarEmoji(localStorage.getItem("user_avatar_emoji"));
    };
    updateAvatar();
    window.addEventListener("ecogreen_avatar_updated", updateAvatar);
    return () => {
      window.removeEventListener("ecogreen_avatar_updated", updateAvatar);
    };
  }, []);

  const t = (key: string) => {
    const keyMap: Record<string, { key: string; def: string }> = {
      "Tổng quan": { key: "layout.menu.DASHBOARD", def: "Tổng quan" },
      "Quản lý thiết bị": {
        key: "layout.menu.DEVICE",
        def: "Quản lý thiết bị",
      },
      "Biểu đồ": { key: "layout.menu.CHART", def: "Biểu đồ" },
      "Lịch sử dữ liệu": { key: "layout.menu.HISTORY", def: "Lịch sử dữ liệu" },
      "Lịch trình tưới": {
        key: "layout.menu.SCHEDULE",
        def: "Lịch trình tưới",
      },
      "Ngưỡng tưới & Logic": {
        key: "layout.menu.THRESHOLDS",
        def: "Ngưỡng tưới & Logic",
      },
      "Cấu hình thông báo": {
        key: "layout.menu.NOTIFICATION",
        def: "Cấu hình thông báo",
      },
      "Nhật ký hoạt động": { key: "layout.menu.LOG", def: "Nhật ký hoạt động" },
      "Logic thông minh": {
        key: "layout.menu.SMART LOGIC",
        def: "Logic thông minh",
      },
      "Thông tin cá nhân": {
        key: "layout.menu.PROFILE",
        def: "Thông tin cá nhân",
      },
      DASHBOARD: { key: "layout.menu.DASHBOARD", def: "Tổng quan" },
      DEVICE: { key: "layout.menu.DEVICE", def: "Quản lý thiết bị" },
      CHART: { key: "layout.menu.CHART", def: "Biểu đồ" },
      HISTORY: { key: "layout.menu.HISTORY", def: "Lịch sử dữ liệu" },
      SCHEDULE: { key: "layout.menu.SCHEDULE", def: "Lịch trình tưới" },
      THRESHOLDS: { key: "layout.menu.THRESHOLDS", def: "Ngưỡng tưới & Logic" },
      NOTIFICATION: {
        key: "layout.menu.NOTIFICATION",
        def: "Cấu hình thông báo",
      },
      LOG: { key: "layout.menu.LOG", def: "Nhật ký hoạt động" },
      "SMART LOGIC": {
        key: "layout.menu.SMART LOGIC",
        def: "Logic thông minh",
      },
      PROFILE: { key: "layout.menu.PROFILE", def: "Thông tin cá nhân" },
      logout: { key: "common.logout", def: "Đăng xuất" },
      smartFarming: {
        key: "layout.smartFarming",
        def: "Nông nghiệp thông minh",
      },
      searchPlaceholder: {
        key: "layout.searchPlaceholder",
        def: "Tìm kiếm thông tin, thiết bị...",
      },
      timeTitle: { key: "layout.accountProfile", def: "Thông tin tài khoản" },
      logoutConfirm: {
        key: "layout.logoutConfirm",
        def: "Bạn có chắc chắn muốn đăng xuất khỏi hệ thống EcoGreen không?",
      },
      cancel: { key: "common.cancel", def: "Hủy bỏ" },
      activeStatus: { key: "common.activeStatus", def: "Đang hoạt động" },
      editProfile: { key: "profile.avatar.change", def: "Chỉnh sửa hồ sơ" },
      detailTitle: {
        key: "profile.securityCheck.title",
        def: "Thông tin chi tiết",
      },
      emailLabel: { key: "profile.form.email", def: "Địa chỉ Email" },
      userIdLabel: {
        key: "profile.form.userId",
        def: "Mã người dùng (User ID)",
      },
      roleLabel: { key: "profile.role", def: "Quyền hạn hệ thống" },
      adminRole: { key: "profile.adminRole", def: "Thành viên quản trị" },
      noEmail: { key: "common.n_a", def: "Chưa thiết lập" },
      notAvailable: { key: "common.n_a", def: "Chưa cập nhật" },
      logoutTitle: { key: "layout.logoutTitle", def: "Đăng xuất tài khoản" },
      collapseTitle: {
        key: "layout.collapseTitle",
        def: "Thu gọn/Mở rộng menu",
      },
      supportTitle: { key: "layout.supportTitle", def: "Hỗ trợ" },
      notifTitle: { key: "layout.notifTitle", def: "Thông báo" },
    };

    const mapping = keyMap[key];
    if (mapping) {
      return contextT(mapping.key, mapping.def);
    }
    return contextT(key, key);
  };

  const translatedNavItems = navItems.map((item) => ({
    ...item,
    label: t(item.key),
    title: t(item.key),
  }));

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  // Find active menu item
  const currentItem =
    (activeMenu
      ? translatedNavItems.find((item) => item.key === activeMenu)
      : null) ??
    translatedNavItems.find(
      (item) =>
        item.href === pathname || Boolean(item.aliases?.includes(pathname)),
    ) ??
    translatedNavItems[0];

  // Get user initials for profile avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const initials =
    mounted && user
      ? getInitials(user.full_name || user.username || "User")
      : "US";

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutModal(false);
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 font-sans">
      <Suspense fallback={null}>
        <TokenCapturer />
      </Suspense>
      {/* Sidebar (Thanh dọc) */}
      <aside
        className={`bg-[#09120D] border-r border-emerald-955/10 flex flex-col transition-all duration-300 ease-in-out shadow-2xl relative z-20 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo Container */}
        <div
          className={`h-16 flex items-center border-b border-white/10 transition-all duration-300 ${
            isCollapsed ? "justify-center px-2" : "px-6"
          }`}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Leaf size={18} className="animate-pulse fill-white/10" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 justify-center py-0.5">
                <span className="text-lg font-black tracking-wide font-sans truncate bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent leading-[1.15] block">
                  EcoGreen
                </span>
                <span className="text-[0.58rem] text-emerald-400/85 font-extrabold tracking-widest uppercase truncate mt-0.5 block leading-none">
                  {t("smartFarming")}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-2">
          {translatedNavItems.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={item.key === currentItem.key}
              isCollapsed={isCollapsed}
            />
          ))}
        </nav>

        {/* User Profile & Logout Section */}
        <div className="p-3 border-t border-white/10 mt-auto">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => setShowProfileDrawer(true)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-sm font-bold text-white shadow-inner cursor-pointer transition-all overflow-hidden"
                title={t("timeTitle")}
              >
                {avatarEmoji ? (
                  <span className="text-xl leading-none select-none">
                    {avatarEmoji}
                  </span>
                ) : mounted && user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  initials
                )}
              </div>
              <button
                onClick={handleLogoutClick}
                className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all duration-200"
                title={t("logout")}
                type="button"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-200">
              <div
                onClick={() => setShowProfileDrawer(true)}
                className="flex items-center gap-3 cursor-pointer min-w-0"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/80 to-green-600/80 text-white flex items-center justify-center text-sm font-bold shadow-md shadow-emerald-500/5 select-none hover:from-emerald-500 hover:to-green-600 transition-all flex-shrink-0 overflow-hidden">
                  {avatarEmoji ? (
                    <span className="text-xl leading-none select-none">
                      {avatarEmoji}
                    </span>
                  ) : mounted && user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-white leading-tight truncate">
                    {mounted && user
                      ? user.full_name || user.username || "User"
                      : "User"}
                  </p>
                  <p className="text-[10px] text-emerald-300/80 leading-none mt-1 font-semibold tracking-wider">
                    {t("adminRole")}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogoutClick}
                className="p-2 rounded-xl text-emerald-100/50 hover:bg-red-500/15 hover:text-red-400 transition-all duration-200 flex-shrink-0"
                title={t("logout")}
                type="button"
                id="logout-btn"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header (Thanh trên) */}
        <header className="h-16 bg-gradient-to-r from-emerald-700 via-emerald-800 to-green-700 shadow-md flex items-center justify-between px-6 text-white select-none">
          {/* Header Left (Title & Menu Button) */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleCollapse}
              className="p-2 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
              title={t("collapseTitle")}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-bold tracking-wide text-white truncate max-w-[200px] sm:max-w-none">
              {pageTitle ? t(pageTitle) : currentItem.title}
            </h2>
          </div>

          {/* Header Middle (Search Bar) */}
          <div className="hidden md:flex items-center relative w-96 max-w-md mx-4">
            <span className="absolute left-3.5 text-white/50">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 focus:border-white/30 rounded-full text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Header Right (Actions & User Profile) */}
          <div className="flex items-center space-x-3">
            <RealtimeClock />

            {/* Notification Bell */}
            <Link
              href="/dashboard/notifications"
              className="p-2 rounded-xl hover:bg-white/10 transition-colors relative"
              title={t("notifTitle")}
            >
              <Bell size={20} className="text-white/80 hover:text-white" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-emerald-800 rounded-full"></span>
            </Link>

            {/* Help Icon */}
            <button
              className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/80 hover:text-white"
              title={t("supportTitle")}
            >
              <HelpCircle size={20} />
            </button>

            {/* Vertical Divider */}
            <span className="h-6 border-l border-white/20 mx-1"></span>

            {/* User Profile info */}
            <div
              onClick={() => setShowProfileDrawer(true)}
              className="flex items-center gap-3 pl-2 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white leading-tight">
                  {mounted && user
                    ? user.full_name || user.username || "User"
                    : "User"}
                </p>
                <p className="text-[10px] text-emerald-100/70 leading-none mt-0.5">
                  {mounted && user ? user.email || "" : ""}
                </p>
              </div>
              <div
                className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold text-white shadow-inner select-none hover:bg-white/20 transition-all overflow-hidden"
                suppressHydrationWarning
              >
                {avatarEmoji ? (
                  <span className="text-lg leading-none select-none">
                    {avatarEmoji}
                  </span>
                ) : mounted && user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  initials
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8fafc] p-6">
          {children}
        </main>

        {/* Profile Drawer */}
        {showProfileDrawer && (
          <div className="fixed inset-0 z-50 overflow-hidden select-none">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in"
              onClick={() => setShowProfileDrawer(false)}
            />

            {/* Drawer Content */}
            <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-slide-in-right border-l border-slate-100">
              {/* Drawer Header */}
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <User className="text-emerald-600 size-5" />
                  <span className="text-base font-extrabold text-slate-800">
                    {t("timeTitle")}
                  </span>
                </div>
                <button
                  onClick={() => setShowProfileDrawer(false)}
                  className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Avatar Card */}
                <div className="flex flex-col items-center p-6 bg-gradient-to-b from-emerald-50/50 to-transparent rounded-3xl border border-emerald-500/10">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-emerald-500/20 mb-4 border-4 border-white overflow-hidden">
                    {avatarEmoji ? (
                      <span className="text-4xl select-none leading-none">
                        {avatarEmoji}
                      </span>
                    ) : mounted && user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {user?.full_name || t("notAvailable")}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    @{user?.username || "username"}
                  </p>

                  {/* Status Pill */}
                  <span className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    {t("activeStatus")}
                  </span>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
                    {t("detailTitle")}
                  </h4>

                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4.5 space-y-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {t("emailLabel")}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 mt-0.5 block truncate">
                        {user?.email || t("noEmail")}
                      </span>
                    </div>

                    <div className="h-px bg-slate-200/60" />

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {t("userIdLabel")}
                      </span>
                      <span className="text-sm font-mono font-medium text-slate-500 mt-0.5 block truncate">
                        {user?.User_ID || t("notAvailable")}
                      </span>
                    </div>

                    <div className="h-px bg-slate-200/60" />

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {t("roleLabel")}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 mt-0.5 block">
                        {t("adminRole")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowProfileDrawer(false);
                    router.push("/profile");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-sm font-bold text-white shadow-md shadow-emerald-500/10 transition cursor-pointer"
                  type="button"
                >
                  <User size={16} />
                  {t("editProfile")}
                </button>
                <button
                  onClick={() => {
                    setShowProfileDrawer(false);
                    handleLogoutClick();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-bold text-slate-600 transition cursor-pointer"
                  type="button"
                >
                  <LogOut size={16} />
                  {t("logout")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Logout Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white border border-slate-100 rounded-[24px] max-w-sm w-full p-6 shadow-2xl shadow-slate-950/20 animate-scale-up">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <LogOut size={22} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 text-center mb-1">
                {t("logoutTitle")}
              </h3>
              <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed px-2">
                {t("logoutConfirm")}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelLogout}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-600 transition-all cursor-pointer text-center focus:outline-none"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all cursor-pointer text-center focus:outline-none"
                >
                  {t("logout")}
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleUp {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.2s ease-out forwards;
          }
          .animate-scale-up {
            animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .animate-slide-in-right {
            animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>
      </div>

      {/* Tích hợp nút Micro trôi cho Voice Control */}
      <VoiceAssistantButton />
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  href,
  isCollapsed,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  href: string;
  isCollapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center rounded-xl transition-all duration-200 ${
        isCollapsed ? "justify-center p-3" : "space-x-3 px-4 py-3"
      } ${
        active
          ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] font-semibold scale-[1.02]"
          : "text-emerald-100/60 hover:text-white hover:bg-white/5"
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div
        className={`flex-shrink-0 transition-transform duration-200 ${
          active ? "scale-110" : ""
        }`}
      >
        {icon}
      </div>
      {!isCollapsed && (
        <span className="text-sm tracking-wide font-medium">{label}</span>
      )}
    </Link>
  );
}
