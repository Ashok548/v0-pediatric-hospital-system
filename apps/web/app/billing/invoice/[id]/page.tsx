import { InvoicePreview } from "@/components/billing/shared/InvoicePreview"

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div className="p-4 lg:p-6 bg-zinc-50 min-h-screen">
            <InvoicePreview id={id} />
        </div>
    )
}
