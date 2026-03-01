import { AppShell } from "@/components/hospital/app-shell"
import { PrescriptionContent } from "@/components/hospital/prescription-content"

export default async function PatientPrescriptionPage({
    params,
}: {
    params: Promise<{ patientId: string }>
}) {
    const { patientId } = await params
    return (
        <AppShell activeItem="Patients">
            <PrescriptionContent patientId={patientId} />
        </AppShell>
    )
}
