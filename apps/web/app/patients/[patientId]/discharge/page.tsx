import { AppShell } from "@/components/hospital/app-shell"
import { DischargeSummaryContent } from "@/components/hospital/discharge-summary-content"

export default async function PatientDischargePage({
    params,
}: {
    params: Promise<{ patientId: string }>
}) {
    const { patientId } = await params
    return (
        <AppShell activeItem="Patients">
            <DischargeSummaryContent patientId={patientId} />
        </AppShell>
    )
}
