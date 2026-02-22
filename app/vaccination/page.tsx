import { AppShell } from "@/components/hospital/app-shell"
import { VaccinationContent } from "@/components/hospital/vaccination-content"

export default function VaccinationPage() {
  return (
    <AppShell activeItem="Vaccination">
      <VaccinationContent />
    </AppShell>
  )
}
