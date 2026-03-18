"use client"

import { use, useEffect } from "react"
import { AppShell } from "@/components/hospital/app-shell"
import { DischargeClearanceStepper } from "@/components/hospital/discharge-clearance-stepper"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { useAdmission } from "@/lib/api/admissions"
import { useAuth } from "@/hooks/use-auth"

interface Props { params: Promise<{ id: string }> }

export default function DischargePage({ params }: Props) {
    const { id } = use(params)
    return (
        <AppShell activeItem="Admissions">
            <DischargePageContent admissionId={id} />
        </AppShell>
    )
}

function DischargePageContent({ admissionId }: { admissionId: string }) {
    const router = useRouter()
    const { role, isLoading: authLoading } = useAuth()
    const { admission, isLoading, error } = useAdmission(admissionId)
    const canInitiateDischarge = role === "DOCTOR" || role === "ADMIN"

    useEffect(() => {
        if (!authLoading && !canInitiateDischarge) {
            router.replace("/unauthorized")
        }
    }, [authLoading, canInitiateDischarge, router])

    if (authLoading || !canInitiateDischarge) {
        return (
            <div className="flex-1 space-y-4 p-6 pt-4 max-w-2xl mx-auto">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

    return (
        <div className="flex-1 space-y-6 p-6 pt-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
                <Link href="/admissions">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                        <ArrowLeft className="h-4 w-4" /> Admissions
                    </Button>
                </Link>
            </div>

            {isLoading && (
                <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                    <Skeleton className="h-64 w-full" />
                </div>
            )}

            {error && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-destructive">
                    <AlertCircle className="h-10 w-10" />
                    <p className="font-medium">Failed to load admission</p>
                    <p className="text-sm text-muted-foreground">{error.message}</p>
                    <Link href="/admissions"><Button variant="outline">Back to Admissions</Button></Link>
                </div>
            )}

            {admission && (
                <>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Patient Discharge</h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            {admission.patient.firstName} {admission.patient.lastName} · {admission.admissionNumber} · Multi-department clearance required
                        </p>
                    </div>
                    <DischargeClearanceStepper admission={admission} />
                </>
            )}
        </div>
    )
}
