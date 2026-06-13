import DashboardLayout from "@/components/layout/DashboardLayout";
import { SmartLogicView } from "@/features/smart-logic/components/SmartLogicView";

export default function SmartLogicPage() {
  return (
    <DashboardLayout activeMenu="SMART LOGIC" pageTitle="Logic thông minh">
      <SmartLogicView />
    </DashboardLayout>
  );
}
