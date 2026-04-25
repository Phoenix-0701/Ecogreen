import DashboardLayout from "@/components/layout/DashboardLayout";
import { DeviceControlView } from "@/features/devices/components/DeviceControlView";

export default function DevicesPage() {
  return (
    <DashboardLayout>
      <DeviceControlView />
    </DashboardLayout>
  );
}
