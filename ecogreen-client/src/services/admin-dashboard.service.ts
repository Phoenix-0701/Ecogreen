import { fetcher } from "./api";
import {
  AdminDashboardData,
  DashboardStat,
} from "@/types/admin-dashboard";
import { DollarSign, ShoppingCart, Sprout, Trees } from "lucide-react";

const mockAdminDashboardData: AdminDashboardData = {
  stats: [
    {
      title: "Doanh thu",
      value: "0 ₫",
      change: "+0%",
      iconName: "dollarSign",
      iconColor: "#10b981",
      bgColor: "rgba(16,185,129,0.1)",
    },
    {
      title: "Số lượng cây",
      value: "0",
      change: "+0%",
      iconName: "trees",
      iconColor: "#3b82f6",
      bgColor: "rgba(59,130,246,0.1)",
    },
    {
      title: "Đơn hàng",
      value: "0",
      change: "+0%",
      iconName: "shoppingCart",
      iconColor: "#8b5cf6",
      bgColor: "rgba(139,92,246,0.1)",
    },
    {
      title: "Mầm cây",
      value: "0",
      change: "+0%",
      iconName: "sprout",
      iconColor: "#10b981",
      bgColor: "rgba(16,185,129,0.1)",
    },
  ],
  monthlyRevenueData: [],
  orderStatusData: [],
  topTreeProducts: [],
  gardenPerformanceData: [],
  insight: "Không có dữ liệu.",
};

const iconMap = {
  trees: Trees,
  shoppingCart: ShoppingCart,
  dollarSign: DollarSign,
  sprout: Sprout,
};

function withIcons(stats: DashboardStat[]) {
  return stats.map((item) => ({
    ...item,
    icon: iconMap[item.iconName],
  }));
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const data = await fetcher<AdminDashboardData>("/admin/dashboard");
    return {
      ...data,
      stats: withIcons(data.stats),
    };
  } catch {
    return {
      ...mockAdminDashboardData,
      stats: withIcons(mockAdminDashboardData.stats),
    };
  }
}
