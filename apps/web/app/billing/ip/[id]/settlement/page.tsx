import { FinalSettlementForm } from "@/components/billing/ip/FinalSettlementForm"

export default function IPSettlementPage({ params }: { params: { id: string } }) {
    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <FinalSettlementForm id={params.id} />
        </div>
    )
}
