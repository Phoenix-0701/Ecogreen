import { fetcher } from "./api";
import { mockAdminDashboardData } from "@/features/admin-dashboard/data/mockDashboardData";
import {
  AdminDashboardData,
  DashboardStat,
} from "@/types/admin-dashboard";
import { DollarSign, ShoppingCart, Sprout, Trees } from "lucide-react";

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
    const data = await fetcher("/admin/dashboard");
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
