import { AppShell } from "@/components/hospital/app-shell"
import { GrowthTrackingContent } from "@/components/hospital/growth-tracking-content"

export default async function PatientGrowthPage({
    params,
}: {
    params: Promise<{ patientId: string }>
}) {
    const { patientId } = await params
    return (
        <AppShell activeItem="Patients">
            <GrowthTrackingContent patientId={patientId} />
        </AppShell>
    )
}
