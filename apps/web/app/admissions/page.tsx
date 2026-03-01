import { AppShell } from "@/components/hospital/app-shell"
import { AdmissionsContent } from "@/components/hospital/admissions-content"

export default function AdmissionsPage() {
    return (
        <AppShell activeItem="Admissions">
            <AdmissionsContent />
        </AppShell>
    )
}
