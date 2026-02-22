import { AppShell } from "@/components/hospital/app-shell"
import { PatientRegistrationContent } from "@/components/hospital/patient-registration-content"

export default function PatientRegistrationPage() {
  return (
    <AppShell activeItem="Patients">
      <PatientRegistrationContent />
    </AppShell>
  )
}
