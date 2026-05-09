"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { HistoryView } from "@/features/dashboard/components/HistoryView";

export default function HistoryPage() {
  return (
    <DashboardLayout activeMenu="Lịch sử" pageTitle="Lịch sử dữ liệu">
      <HistoryView />
    </DashboardLayout>
  );
}