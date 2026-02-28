import { IPRunningBillView } from "@/components/billing/ip/IPRunningBillView"

export default function IPRoutingDetailsPage({ params }: { params: { id: string } }) {
    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <IPRunningBillView id={params.id} />
        </div>
    )
}
