import { ReceiptPreview } from "@/components/billing/shared/ReceiptPreview"

export default function ReceiptPage({ params }: { params: { id: string } }) {
    return (
        <div className="p-4 lg:p-6 bg-zinc-50 min-h-screen">
            <ReceiptPreview id={params.id} />
        </div>
    )
}
