import { AppShell } from "@/components/hospital/app-shell"
import { BillingContent } from "@/components/hospital/billing-content"

export default function BillingPage() {
    return (
        <AppShell activeItem="Billing">
            <BillingContent />
        </AppShell>
    )
}
