import { AppShell } from "@/components/hospital/app-shell"
import { VaccinationContent } from "@/components/hospital/vaccination-content"

// The existing VaccinationContent displays the per-patient vaccination record.
// patientId from the URL can be used to load specific patient data in the future.
export default async function VaccinationPatientPage({
    params,
}: {
    params: Promise<{ patientId: string }>
}) {
    const { patientId } = await params
    return (
        <AppShell activeItem="Vaccination">
            <VaccinationContent patientId={patientId} />
        </AppShell>
    )
}
