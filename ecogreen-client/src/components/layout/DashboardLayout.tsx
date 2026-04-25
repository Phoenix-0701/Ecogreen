"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  LayoutDashboard,
  Radio,
  Settings2,
  Sparkles,
  UserCircle2,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  title: string;
  icon: ReactNode;
};

const mainItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Bảng điều khiển",
    title: "Bảng điều khiển",
    icon: <LayoutDashboard size={18} />,
  },
  {
    href: "/devices",
    label: "Thiết bị",
    title: "Thiết bị",
    icon: <Radio size={18} />,
  },
  {
    href: "/thresholds",
    label: "Ngưỡng tưới",
    title: "Ngưỡng tưới",
    icon: <Settings2 size={18} />,
  },
  {
    href: "/schedule",
    label: "Lịch trình",
    title: "Lịch trình",
    icon: <ClipboardList size={18} />,
  },
  {
    href: "/smart-logic",
    label: "Logic thông minh",
    title: "Logic thông minh",
    icon: <Sparkles size={18} />,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const currentItem = mainItems.find((item) => item.href === pathname) ?? mainItems[0];

  return (
    <div className="min-h-screen bg-[#f4f6f5] text-[#33423a]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[292px] shrink-0 border-r border-[#d8ded9] bg-[#eef2ef] px-6 py-5 shadow-[inset_-1px_0_0_rgba(216,222,217,0.8)] lg:flex lg:flex-col">
          <div className="rounded-[30px] bg-white/90 px-5 py-7 shadow-[0_18px_45px_rgba(20,57,43,0.06)]">
            <div className="px-2">
              <h1
                className="text-[28px] font-semibold italic text-[#1f7157]"
                style={{ fontFamily: "var(--font-fraunces)" }}
              >
                Emerald Orbit
              </h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#9aa69f]">
                PHÒNG THÍ NGHIỆM SỐNG
              </p>
            </div>

            <nav className="mt-8 space-y-1.5">
              {mainItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  active={pathname === item.href}
                />
              ))}
            </nav>

          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[#d8ded9] bg-white/85 backdrop-blur-md">
            <div className="flex items-center justify-between px-5 py-4 sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#93a098]">
                  EcoGreen
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-[#25332d]">
                  {currentItem.title}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="flex size-10 items-center justify-center rounded-full border border-[#e0e6e2] bg-white text-[#6f7c74] transition-colors hover:text-[#1f7157]"
                >
                  <Bell size={18} />
                </button>
                <div className="flex items-center gap-3 rounded-full border border-[#e0e6e2] bg-white px-2 py-1.5">
                  <div className="flex size-8 items-center justify-center rounded-full bg-[#dbf7ea] text-[#1f7157]">
                    <UserCircle2 size={18} />
                  </div>
                  <div className="hidden pr-2 sm:block">
                    <p className="text-sm font-semibold text-[#25332d]">
                      EcoGreen Lab
                    </p>
                    <p className="text-xs text-[#93a098]">Operator</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarItem({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-full px-4 py-3.5 text-[15px] transition-all ${
        active
          ? "bg-[#dff0ea] font-semibold text-[#1f7157]"
          : "text-[#5f6b64] hover:bg-[#f4f8f5] hover:text-[#1f7157]"
      }`}
    >
      <span className={active ? "text-[#1f7157]" : "text-[#69766f]"}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
