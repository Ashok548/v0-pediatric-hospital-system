import { AppShell } from "@/components/hospital/app-shell"
import { LabDashboardContent } from "@/components/hospital/lab-dashboard-content"

export default function LabPage() {
  return (
    <AppShell activeItem="Lab">
      <LabDashboardContent />
    </AppShell>
  )
}
