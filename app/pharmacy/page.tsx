import { PharmacyContent } from "@/components/hospital/pharmacy-content"
import { AppShell } from "@/components/hospital/app-shell"

export default function PharmacyPage() {
    return (
        <AppShell activeItem="Pharmacy">
            <PharmacyContent />
        </AppShell>
    )
}
