import { AppShell } from "@/components/hospital/app-shell"
import { PatientsListContent } from "@/components/hospital/patients-list-content"

export default function PatientsPage() {
  return (
    <AppShell activeItem="Patients">
      <PatientsListContent />
    </AppShell>
  )
}
