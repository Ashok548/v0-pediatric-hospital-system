import { AppShell } from "@/components/hospital/app-shell"
import { NicuContent } from "@/components/hospital/nicu-content"

export default function NicuPage() {
  return (
    <AppShell activeItem="NICU">
      <NicuContent />
    </AppShell>
  )
}
