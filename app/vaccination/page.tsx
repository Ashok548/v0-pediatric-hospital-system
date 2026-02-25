import { AppShell } from "@/components/hospital/app-shell"
import { VaccinationDashboardContent } from "@/components/hospital/vaccination-dashboard-content"

export default function VaccinationPage() {
  return (
    <AppShell activeItem="Vaccination">
      <VaccinationDashboardContent />
    </AppShell>
  )
}

