import { AppShell } from "@/components/hospital/app-shell"
import { LabResultsContent } from "@/components/hospital/lab-results-content"

export default async function LabOrderPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = await params;
    return (
        <AppShell activeItem="Lab">
            <LabResultsContent orderId={orderId} />
        </AppShell>
    )
}
