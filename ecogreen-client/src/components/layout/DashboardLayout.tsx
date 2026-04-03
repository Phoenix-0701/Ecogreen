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
} from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="h-16 flex items-center justify-center border-b">
          <h1 className="text-xl font-bold text-green-600 tracking-wider">
            🌿 EcoGreen
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarItem
            icon={<LayoutDashboard size={20} />}
            label="DASHBOARD"
            active
          />
          <SidebarItem icon={<Cpu size={20} />} label="DEVICE" />
          <SidebarItem icon={<LineChart size={20} />} label="CHART" />
          <SidebarItem icon={<CalendarClock size={20} />} label="SCHEDULE" />
          <SidebarItem icon={<Bell size={20} />} label="NOTIFICATION" />
          <SidebarItem icon={<ScrollText size={20} />} label="LOG" />
          <SidebarItem icon={<BrainCircuit size={20} />} label="SMART LOGIC" />
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-full hover:bg-gray-100 relative">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
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
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href="#"
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
