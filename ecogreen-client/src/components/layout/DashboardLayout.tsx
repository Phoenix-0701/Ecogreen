"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BrainCircuit,
  CalendarClock,
  Cpu,
  History,
  LayoutDashboard,
  Leaf,
  LineChart,
  LogOut,
  ScrollText,
  Settings2,
  User,
} from "lucide-react";
import { useAuth } from "@/features/auth/auth.context";

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
    label: "DASHBOARD",
    title: "Dashboard",
    icon: <LayoutDashboard size={20} />,
  },
  {
    key: "DEVICE",
    href: "/dashboard/devices",
    label: "DEVICE",
    title: "Quan ly thiet bi",
    icon: <Cpu size={20} />,
  },
  {
    key: "CHART",
    href: "/dashboard/chart",
    label: "CHART",
    title: "Chart",
    icon: <LineChart size={20} />,
  },
  {
    key: "HISTORY",
    href: "/dashboard/history",
    label: "HISTORY",
    title: "Lich su du lieu",
    icon: <History size={20} />,
  },
  {
    key: "SCHEDULE",
    href: "/schedule",
    label: "SCHEDULE",
    title: "Lich trinh",
    icon: <CalendarClock size={20} />,
    aliases: ["/dashboard/schedule"],
  },
  {
    key: "THRESHOLDS",
    href: "/thresholds",
    label: "THRESHOLDS",
    title: "Nguong tuoi",
    icon: <Settings2 size={20} />,
  },
  {
    key: "NOTIFICATION",
    href: "/dashboard/notifications",
    label: "NOTIFICATION",
    title: "Thong bao",
    icon: <Bell size={20} />,
  },
  {
    key: "LOG",
    href: "/dashboard/logs",
    label: "LOG",
    title: "Log",
    icon: <ScrollText size={20} />,
  },
  {
    key: "SMART LOGIC",
    href: "/smart-logic",
    label: "SMART LOGIC",
    title: "Smart logic",
    icon: <BrainCircuit size={20} />,
    aliases: ["/dashboard/smart-logic"],
  },
];

interface DashboardLayoutProps {
  children: ReactNode;
  activeMenu?: string;
  pageTitle?: string;
}

function isActiveItem(item: NavItem, pathname: string, activeMenu?: string) {
  return (
    item.key === activeMenu ||
    item.href === pathname ||
    Boolean(item.aliases?.includes(pathname))
  );
}

export default function DashboardLayout({
  children,
  activeMenu = "DASHBOARD",
  pageTitle,
}: DashboardLayoutProps) {
  const pathname = usePathname() ?? "";
  const { user, logout } = useAuth();
  const currentItem =
    navItems.find((item) => isActiveItem(item, pathname, activeMenu)) ??
    navItems[0];

  return (
    <div className="flex h-screen bg-gray-100">
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
          {navItems.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isActiveItem(item, pathname, activeMenu)}
            />
          ))}
        </nav>

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
            type="button"
          >
            <LogOut size={16} />
            Dang xuat
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {pageTitle || currentItem.title}
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

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  label,
  active,
  href,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  href: string;
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
