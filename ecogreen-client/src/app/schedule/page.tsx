import DashboardLayout from "@/components/layout/DashboardLayout";
import { ScheduleView } from "@/features/schedule/components/ScheduleView";

export default function SchedulePage() {
  return (
    <DashboardLayout>
      <ScheduleView />
    </DashboardLayout>
  );
}
