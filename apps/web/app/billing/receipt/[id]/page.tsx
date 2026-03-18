import { ReceiptPreview } from "@/components/billing/shared/ReceiptPreview"

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div className="p-4 lg:p-6 bg-zinc-50 min-h-screen">
            <ReceiptPreview id={id} />
        </div>
    )
}
