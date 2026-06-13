import DashboardLayout from "@/components/layout/DashboardLayout";
import { ThresholdsView } from "@/features/thresholds/components/ThresholdsView";

export default function ThresholdsPage() {
  return (
    <DashboardLayout activeMenu="THRESHOLDS" pageTitle="Ngưỡng tưới & Logic">
      <ThresholdsView />
    </DashboardLayout>
  );
}
