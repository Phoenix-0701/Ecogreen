"use client";

import React from "react";
import {
  LayoutDashboard,
  Cpu,
  LineChart,
  CalendarClock,
  Bell,
  ScrollText,
  BrainCircuit,
  User,
  LogOut,
  Leaf,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/features/auth/auth.context";

// Map label -> route
const menuRoutes: Record<string, string> = {
  DASHBOARD: "/dashboard",
  DEVICE: "/dashboard/devices",
  CHART: "/dashboard/chart",
  SCHEDULE: "/dashboard/schedule",
  NOTIFICATION: "/dashboard/notifications",
  LOG: "/dashboard/logs",
  "SMART LOGIC": "/dashboard/smart-logic",
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeMenu?: string;
  pageTitle?: string;
}

export default function DashboardLayout({
  children,
  activeMenu = "DASHBOARD",
  pageTitle,
}: DashboardLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="h-16 flex items-center justify-center border-b gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-sm">
            <Leaf size={16} />
          </div>
          <h1 className="text-xl font-bold text-green-600 tracking-wider">
            EcoGreen
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="DASHBOARD"
            href={menuRoutes["DASHBOARD"]}
            active={activeMenu === "DASHBOARD"}
          />
          <SidebarItem
            icon={<Cpu size={20} />}
            label="DEVICE"
            href={menuRoutes["DEVICE"]}
            active={activeMenu === "DEVICE"}
          />
          <SidebarItem
            icon={<LineChart size={20} />}
            label="CHART"
            href={menuRoutes["CHART"]}
            active={activeMenu === "CHART"}
          />
          <SidebarItem
            icon={<CalendarClock size={20} />}
            label="SCHEDULE"
            href={menuRoutes["SCHEDULE"]}
            active={activeMenu === "SCHEDULE"}
          />
          <SidebarItem
            icon={<Bell size={20} />}
            label="NOTIFICATION"
            href={menuRoutes["NOTIFICATION"]}
            active={activeMenu === "NOTIFICATION"}
          />
          <SidebarItem
            icon={<ScrollText size={20} />}
            label="LOG"
            href={menuRoutes["LOG"]}
            active={activeMenu === "LOG"}
          />
          <SidebarItem
            icon={<BrainCircuit size={20} />}
            label="SMART LOGIC"
            href={menuRoutes["SMART LOGIC"]}
            active={activeMenu === "SMART LOGIC"}
          />
        </nav>

        {/* User info + Logout */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
              <User size={18} className="text-green-700" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.full_name || user?.username || "User"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email || ""}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            id="logout-btn"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {pageTitle || activeMenu.charAt(0) + activeMenu.slice(1).toLowerCase()}
          </h2>
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/notifications"
              className="p-2 rounded-full hover:bg-gray-100 relative"
            >
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <User size={18} className="text-green-700" />
            </div>
          </div>
        </header>

        {/* NƠI HIỂN THỊ NỘI DUNG TỪNG TRANG */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Bổ sung Component nhỏ cho nút bấm ở Sidebar
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
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        active
          ? "bg-green-50 text-green-600 font-semibold"
          : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </Link>
  );
}
