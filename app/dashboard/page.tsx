import { AppShell } from "@/components/hospital/app-shell"
import { DoctorDashboardContent } from "@/components/hospital/doctor-dashboard-content"

export default function DoctorDashboardPage() {
  return (
    <AppShell activeItem="Dashboard">
      <DoctorDashboardContent />
    </AppShell>
  )
}
