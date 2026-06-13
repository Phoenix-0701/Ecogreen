import DashboardLayout from "@/components/layout/DashboardLayout";
import { ChartView } from "@/features/dashboard/components/ChartView";

export default function ChartPage() {
  return (
    <DashboardLayout activeMenu="CHART" pageTitle="Biểu đồ">
      <ChartView />
    </DashboardLayout>
  );
}
