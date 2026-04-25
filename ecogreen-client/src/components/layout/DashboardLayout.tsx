"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Clock,
  BarChart3,
  Wifi,
  Droplet,
  Calendar,
  BrainCircuit,
  Users,
  Bell,
  UserCircle,
  HelpCircle,
  LogOut,
  Leaf,
  Search,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth.context";

// Map label -> route
const menuRoutes: Record<string, string> = {
  "Bảng điều khiển": "/dashboard",
  "Lịch sử": "/dashboard/history",
  "Nhật ký": "/dashboard/logs",
  "Thiết bị": "/dashboard/devices",
  "Ngưỡng tưới": "/dashboard/threshold",
  "Lịch trình": "/dashboard/schedule",
  "Logic thông minh": "/dashboard/smart-logic",
  "Quản lý": "/dashboard/management",
  "Cảnh báo": "/dashboard/notifications",
  "Tài khoản": "/dashboard/account",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeMenu?: string;
  pageTitle?: string;
}

export default function DashboardLayout({
  children,
  activeMenu = "Bảng điều khiển",
  pageTitle = "Lab Overview",
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  React.useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
      {/* SIDEBAR - VERTICAL NAVIGATION */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shadow-sm overflow-y-auto scrollbar-thin">
        {/* Logo & Brand */}
        <div className="sticky top-0 z-10 h-24 flex flex-col items-center justify-center border-b border-gray-100 px-4 bg-white">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 mb-2">
            <Leaf size={20} />
          </div>
          <h1 className="text-lg font-bold text-emerald-700 tracking-wide">
            Emerald Orbit
          </h1>
          <p className="text-xs text-gray-500 font-medium tracking-widest mt-1">
            PHÒNG THÍ NGHIỆM SỐNG
          </p>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 scrollbar-thin">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="Bảng điều khiển"
            href={menuRoutes["Bảng điều khiển"]}
            active={activeMenu === "Bảng điều khiển"}
          />
          <SidebarItem
            icon={<Clock size={20} />}
            label="Lịch sử"
            href={menuRoutes["Lịch sử"]}
            active={activeMenu === "Lịch sử"}
          />
          <SidebarItem
            icon={<BarChart3 size={20} />}
            label="Nhật ký"
            href={menuRoutes["Nhật ký"]}
            active={activeMenu === "Nhật ký"}
          />
          <SidebarItem
            icon={<Wifi size={20} />}
            label="Thiết bị"
            href={menuRoutes["Thiết bị"]}
            active={activeMenu === "Thiết bị"}
          />
          <SidebarItem
            icon={<Droplet size={20} />}
            label="Ngưỡng tưới"
            href={menuRoutes["Ngưỡng tưới"]}
            active={activeMenu === "Ngưỡng tưới"}
          />
          <SidebarItem
            icon={<Calendar size={20} />}
            label="Lịch trình"
            href={menuRoutes["Lịch trình"]}
            active={activeMenu === "Lịch trình"}
          />
          <SidebarItem
            icon={<BrainCircuit size={20} />}
            label="Logic thông minh"
            href={menuRoutes["Logic thông minh"]}
            active={activeMenu === "Logic thông minh"}
          />
          <SidebarItem
            icon={<Users size={20} />}
            label="Quản lý"
            href={menuRoutes["Quản lý"]}
            active={activeMenu === "Quản lý"}
          />
          <SidebarItem
            icon={<Bell size={20} />}
            label="Cảnh báo"
            href={menuRoutes["Cảnh báo"]}
            active={activeMenu === "Cảnh báo"}
          />
          <SidebarItem
            icon={<UserCircle size={20} />}
            label="Tài khoản"
            href={menuRoutes["Tài khoản"]}
            active={activeMenu === "Tài khoản"}
          />
        </nav>

        {/* Action Button */}
        <div className="px-4 py-4 border-t border-gray-100">
          <button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-4 rounded-full transition-all duration-200 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30">
            <Plus size={18} />
            Thử nghiệm mới
          </button>
        </div>

        {/* Footer Sidebar */}
        <div className="border-t border-gray-100 p-4 space-y-2">
          <FooterItem icon={<HelpCircle size={18} />} label="Hỗ trợ" />
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-8 py-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-sm text-gray-500 mt-1">Trạm giám sát chính • {currentTime ? currentTime.toLocaleTimeString('vi-VN') : '...'}</p>
          </div>

          <div className="flex items-center gap-6">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* Notifications */}
            <Link
              href="/dashboard/notifications"
              className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">
                  {user?.full_name || user?.username || "User"}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.email || ""}
                </p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <UserCircle size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-gradient-to-br from-gray-50 via-white to-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}

// Sidebar Menu Item Component
function SidebarItem({
  icon,
  label,
  active = false,
  href = "#",
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
        active
          ? "bg-emerald-50 text-emerald-700 shadow-sm border-l-4 border-emerald-600"
          : "text-gray-700 hover:bg-gray-50 hover:text-emerald-600"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
}

// Footer Item Component
function FooterItem({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}
