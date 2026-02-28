import { AppShell } from "@/components/hospital/app-shell"
import { DischargeWorkflow } from "@/components/admissions/DischargeWorkflow"

export const metadata = {
    title: "Patient Discharge | CareNest HMS",
    description: "Manage the discharge process for an admitted patient.",
}

interface DischargePageProps {
    params: Promise<{ id: string }>
}

export default async function DischargePage({ params }: DischargePageProps) {
    const { id } = await params
    return (
        <AppShell activeItem="Admissions">
            <div className="flex-1 space-y-4 p-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Patient Discharge</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Progress through the discharge workflow. Record is locked after finalization.
                    </p>
                </div>
                <DischargeWorkflow admissionId={id} />
            </div>
        </AppShell>
    )
}
