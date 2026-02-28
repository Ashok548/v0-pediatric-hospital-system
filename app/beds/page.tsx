import { AppShell } from "@/components/hospital/app-shell"
import { BedDashboard } from "@/components/hospital/bed-management/bed-dashboard"

export const metadata = {
    title: "Bed Management | CareNest HMS",
    description: "Real-time bed management, visualization, and patient assignment.",
}

export default function BedsPage() {
    return (
        <AppShell activeItem="Beds">
            <div className="flex-1 space-y-4 p-4 lg:p-6 lg:pt-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bed Management</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Real-time visualization and management of hospital bed occupancy.
                    </p>
                </div>
                <BedDashboard />
            </div>
        </AppShell>
    )
}
