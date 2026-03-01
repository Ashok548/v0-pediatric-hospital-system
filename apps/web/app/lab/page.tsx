import { AppShell } from "@/components/hospital/app-shell"
import { LabResultsContent } from "@/components/hospital/lab-results-content"

export default function LabPage() {
  return (
    <AppShell activeItem="Lab">
      <LabResultsContent />
    </AppShell>
  )
}
