import { LucideIcon } from "lucide-react";

export type MonthlyRevenuePoint = {
  month: string;
  revenue: number;
  orders: number;
};

export type OrderStatusPoint = {
  name: string;
  value: number;
  color: string;
};

export type TopTreeProduct = {
  id: string;
  name: string;
  sold: number;
  stock: number;
  revenue: string;
};

export type GardenPerformancePoint = {
  area: string;
  score: number;
};

export type DashboardStat = {
  title: string;
  value: string;
  change: string;
  iconName: "trees" | "shoppingCart" | "dollarSign" | "sprout";
  icon?: LucideIcon;
  iconColor: string;
  bgColor: string;
};

export type AdminDashboardData = {
  stats: DashboardStat[];
  monthlyRevenueData: MonthlyRevenuePoint[];
  orderStatusData: OrderStatusPoint[];
  topTreeProducts: TopTreeProduct[];
  gardenPerformanceData: GardenPerformancePoint[];
  insight: string;
};
