import DashboardLayout from "@/components/layout/DashboardLayout";
import { DeviceListView } from "@/features/devices/components/DeviceListView";

export default function DevicesPage() {
  return (
    <DashboardLayout activeMenu="DEVICE" pageTitle="Quản lý thiết bị">
      <DeviceListView />
    </DashboardLayout>
  );
}
