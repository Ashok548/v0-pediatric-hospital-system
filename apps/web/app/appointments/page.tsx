import { AppShell } from "@/components/hospital/app-shell"
import { AppointmentsContent } from "@/components/hospital/appointments-content"

export default function AppointmentsPage() {
    return (
        <AppShell activeItem="Appointments">
            <AppointmentsContent />
        </AppShell>
    )
}
