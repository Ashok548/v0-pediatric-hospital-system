import { AppShell } from "@/components/hospital/app-shell"
import { PrescriptionContent } from "@/components/hospital/prescription-content"

export default function PrescriptionPage() {
  return (
    <AppShell activeItem="Patients">
      <PrescriptionContent />
    </AppShell>
  )
}
