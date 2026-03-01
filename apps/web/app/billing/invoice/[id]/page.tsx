import { InvoicePreview } from "@/components/billing/shared/InvoicePreview"

export default function InvoicePage({ params }: { params: { id: string } }) {
    return (
        <div className="p-4 lg:p-6 bg-zinc-50 min-h-screen">
            <InvoicePreview id={params.id} />
        </div>
    )
}
