import { AppShell } from "@/components/hospital/app-shell"
import { GrowthTrackingContent } from "@/components/hospital/growth-tracking-content"

export default function GrowthTrackingPage() {
  return (
    <AppShell activeItem="Patients">
      <GrowthTrackingContent />
    </AppShell>
  )
}
