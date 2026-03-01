import { AppShell } from "@/components/hospital/app-shell"
import { MasterHubContent } from "@/components/hospital/master-hub-content"

export const metadata = {
    title: "Master Data | CareNest HMS",
    description: "Configure hospital master data: floors, wards, beds, departments, and services.",
}

export default function MasterPage() {
    return (
        <AppShell activeItem="Master Data">
            <div className="flex-1 space-y-4 p-4 lg:p-6 lg:pt-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Master Data</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage hospital configuration — floors, wards, beds, departments, and services.
                    </p>
                </div>
                <MasterHubContent />
            </div>
        </AppShell>
    )
}
