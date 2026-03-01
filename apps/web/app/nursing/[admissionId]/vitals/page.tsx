"use client"

import { VitalsChartContent } from "@/components/hospital/vitals-chart-content"
import { AppShell } from "@/components/hospital/app-shell"
import { use } from "react"

interface Props {
    params: Promise<{ admissionId: string }>
}

export default function VitalsPage({ params }: Props) {
    const { admissionId } = use(params)
    return (
        <AppShell activeItem="Nursing">
            <VitalsChartContent admissionId={admissionId} />
        </AppShell>
    )
}
