import DashboardLayout from "@/components/layout/DashboardLayout";
import { NotificationConfigView } from "@/features/notifications/components/NotificationConfigView";

export default function NotificationsPage() {
  return (
    <DashboardLayout activeMenu="NOTIFICATION" pageTitle="Cấu hình thông báo">
      <NotificationConfigView />
    </DashboardLayout>
  );
}
