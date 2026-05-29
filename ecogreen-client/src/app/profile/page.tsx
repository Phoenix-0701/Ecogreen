import DashboardLayout from "@/components/layout/DashboardLayout";
import { ProfileView } from "@/features/profile/components/ProfileView";

export default function ProfilePage() {
  return (
    <DashboardLayout pageTitle="Thông tin cá nhân">
      <ProfileView />
    </DashboardLayout>
  );
}
