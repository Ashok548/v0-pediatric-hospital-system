import { OPBillingForm } from "@/components/billing/op/OPBillingForm"

export default async function OPBillingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div className="p-4 lg:p-6 max-w-6xl mx-auto">
            <OPBillingForm billId={id} />
        </div>
    )
}
