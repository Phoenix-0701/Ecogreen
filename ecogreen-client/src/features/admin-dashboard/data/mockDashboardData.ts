import { AdminDashboardData } from "@/types/admin-dashboard";

export const mockAdminDashboardData: AdminDashboardData = {
  stats: [
    {
      title: "Tong cay dang quan ly",
      value: "1,248",
      change: "+12.4%",
      iconName: "trees",
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Don hang thang nay",
      value: "286",
      change: "+8.1%",
      iconName: "shoppingCart",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Doanh thu thang nay",
      value: "88.0M",
      change: "+15.2%",
      iconName: "dollarSign",
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Ti le song cua cay",
      value: "97.6%",
      change: "+1.3%",
      iconName: "sprout",
      iconColor: "text-lime-600",
      bgColor: "bg-lime-100",
    },
  ],
  monthlyRevenueData: [
    { month: "T1", revenue: 42, orders: 90 },
    { month: "T2", revenue: 58, orders: 120 },
    { month: "T3", revenue: 65, orders: 138 },
    { month: "T4", revenue: 74, orders: 151 },
    { month: "T5", revenue: 69, orders: 146 },
    { month: "T6", revenue: 88, orders: 179 },
  ],
  orderStatusData: [
    { name: "Hoan tat", value: 215, color: "#16a34a" },
    { name: "Dang xu ly", value: 54, color: "#f59e0b" },
    { name: "Da huy", value: 17, color: "#ef4444" },
  ],
  topTreeProducts: [
    {
      id: "DH001",
      name: "Cay Kim Tien",
      sold: 84,
      stock: 36,
      revenue: "25.2M",
    },
    { id: "DH002", name: "Monstera", sold: 73, stock: 22, revenue: "21.9M" },
    {
      id: "DH003",
      name: "Trau Ba Leo Cot",
      sold: 65,
      stock: 41,
      revenue: "19.5M",
    },
    { id: "DH004", name: "Luoi Ho", sold: 59, stock: 55, revenue: "17.7M" },
  ],
  gardenPerformanceData: [
    { area: "Khu A", score: 92 },
    { area: "Khu B", score: 88 },
    { area: "Khu C", score: 95 },
    { area: "Khu D", score: 84 },
  ],
  insight: "Khu C dang co chi so cham soc tot nhat tuan nay.",
};
