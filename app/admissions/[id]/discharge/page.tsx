"use client"

import { useAdmissionStore } from "@/lib/store/admission-store"
import { AppShell } from "@/components/hospital/app-shell"
import { DischargeClearanceStepper } from "@/components/hospital/discharge-clearance-stepper"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, XCircle } from "lucide-react"
import { use } from "react"

interface DischargePageProps {
    params: Promise<{ id: string }>
}

export default function DischargePage({ params }: DischargePageProps) {
    const { id } = use(params)
    return (
        <AppShell activeItem="Admissions">
            <DischargePageContent admissionId={id} />
        </AppShell>
    )
}

function DischargePageContent({ admissionId }: { admissionId: string }) {
    const { getAdmissionById } = useAdmissionStore()
    const admission = getAdmissionById(admissionId)

    if (!admission) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
                <XCircle className="h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Admission not found: <code className="font-mono">{admissionId}</code></p>
                <Link href="/admissions">
                    <Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" />Back to Admissions</Button>
                </Link>
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
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Patient Discharge</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                    {admission.patientName} · {admissionId} · Multi-department clearance required
                </p>
            </div>
            <DischargeClearanceStepper
                admission={admission}
                onDone={() => { window.location.href = "/admissions" }}
            />
        </div>
    )
}
