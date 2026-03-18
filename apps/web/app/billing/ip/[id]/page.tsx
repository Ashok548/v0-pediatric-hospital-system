import { IPRunningBillView } from "@/components/billing/ip/IPRunningBillView"

export default async function IPRoutingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <IPRunningBillView id={id} />
        </div>
    )
}
