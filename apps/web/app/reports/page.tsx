import { AppShell } from "@/components/hospital/app-shell"
import { ReportsContent } from "@/components/hospital/reports-content"

export default function ReportsPage() {
    return (
        <AppShell activeItem="Reports">
            <ReportsContent />
        </AppShell>
    )
}
