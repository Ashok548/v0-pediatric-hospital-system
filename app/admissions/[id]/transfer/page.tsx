import { AppShell } from "@/components/hospital/app-shell"
import { TransferForm } from "@/components/admissions/TransferForm"

export const metadata = {
    title: "Bed Transfer | CareNest HMS",
    description: "Transfer an admitted patient to a different bed or ward.",
}

interface TransferPageProps {
    params: Promise<{ id: string }>
}

export default async function TransferPage({ params }: TransferPageProps) {
    const { id } = await params
    return (
        <AppShell activeItem="Admissions">
            <div className="flex-1 space-y-4 p-6 pt-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bed Transfer</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Reassign a patient to a different bed or ward. All transfers are logged.
                    </p>
                </div>
                <TransferForm admissionId={id} />
            </div>
        </AppShell>
    )
}
