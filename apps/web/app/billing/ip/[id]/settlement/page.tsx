import { FinalSettlementForm } from "@/components/billing/ip/FinalSettlementForm"

export default async function IPSettlementPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
            <FinalSettlementForm id={id} />
        </div>
    )
}
