import { AppShell } from "@/components/hospital/app-shell"
import { PatientDetailContent } from "@/components/hospital/patient-detail-content"

export default async function PatientDetailPage({
    params,
}: {
    params: Promise<{ patientId: string }>
}) {
    const { patientId } = await params
    return (
        <AppShell activeItem="Patients">
            <PatientDetailContent patientId={patientId} />
        </AppShell>
    )
}
