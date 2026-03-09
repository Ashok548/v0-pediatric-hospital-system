import { AppShell } from "@/components/hospital/app-shell"
import { LabResultsContent } from "@/components/hospital/lab-results-content"

export default function LabOrderPage({ params }: { params: { orderId: string } }) {
    return (
        <AppShell activeItem="Lab">
            <LabResultsContent orderId={params.orderId} />
        </AppShell>
    )
}
