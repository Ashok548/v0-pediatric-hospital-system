import { AppShell } from "@/components/hospital/app-shell"
import { DischargeSummaryContent } from "@/components/hospital/discharge-summary-content"

export default function DischargeSummaryPage() {
  return (
    <AppShell activeItem="Patients">
      <DischargeSummaryContent />
    </AppShell>
  )
}
