import { AppShell } from "@/components/hospital/app-shell"
import { NewAdmissionWizard } from "@/components/admissions/NewAdmissionWizard"

export const metadata = {
    title: "New Admission | CareNest HMS",
    description: "Admit a new patient step by step.",
}

export default function NewAdmissionPage() {
    return (
        <AppShell activeItem="Admissions">
            <div className="flex-1 space-y-4 p-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">New Admission</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Complete the three-step process to admit a patient.
                    </p>
                </div>
                <NewAdmissionWizard />
            </div>
        </AppShell>
    )
}
