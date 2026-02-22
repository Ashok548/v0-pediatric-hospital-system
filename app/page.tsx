import { AppShell } from "@/components/hospital/app-shell"
import { DashboardContent } from "@/components/hospital/dashboard-content"

export default function DashboardPage() {
  return (
    <AppShell activeItem="Dashboard">
      <DashboardContent />
    </AppShell>
  )
}
