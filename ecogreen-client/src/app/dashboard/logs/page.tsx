"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { LogsView } from "@/features/dashboard/components/LogsView";

export default function LogsPage() {
  return (
    <DashboardLayout activeMenu="Nhật ký" pageTitle="Nhật ký hoạt động">
      <LogsView />
    </DashboardLayout>
  );
}