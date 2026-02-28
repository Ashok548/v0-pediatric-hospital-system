import { NursingContent } from "@/components/hospital/nursing-content"
import { AppShell } from "@/components/hospital/app-shell"

export default function NursingPage() {
    return (
        <AppShell activeItem="Nursing">
            <NursingContent />
        </AppShell>
    )
}
