"use client"

import { useAdmission } from "@/lib/api/admissions"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, BedDouble } from "lucide-react"
import Link from "next/link"
import { NotesPanel } from "./notes-panel"

interface Props {
    admissionId: string
}

export function NotesPageContent({ admissionId }: Props) {
    const { admission: adm, isLoading } = useAdmission(admissionId)

    return (
        <div className="flex-1 space-y-6 p-6 pt-4 max-w-5xl mx-auto w-full">
            {/* Back + Header */}
            <div className="flex items-center gap-3">
                <Link href="/nursing">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                        <ArrowLeft className="h-4 w-4" /> Nursing Station
                    </Button>
                </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Nursing Notes
                        {isLoading ? (
                            <Loader2 className="inline-block h-4 w-4 animate-spin ml-2 text-muted-foreground" />
                        ) : adm ? (
                            ` — ${adm.patient.firstName} ${adm.patient.lastName}`
                        ) : null}
                    </h1>
                    {adm && (
                        <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                {adm.patient.uhid}
                            </span>
                            <span>·</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium 
                                ${adm.department === 'NICU' ? 'bg-purple-100 text-purple-700' :
                                    adm.department === 'PICU' ? 'bg-red-100 text-red-700' :
                                        adm.department === 'Surgery' ? 'bg-orange-100 text-orange-700' :
                                            'bg-blue-100 text-blue-700'
                                }`}>
                                {adm.department}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                                <BedDouble className="h-3.5 w-3.5" />
                                {adm.currentBed?.ward.name} / <strong>{adm.currentBed?.bedNumber}</strong>
                            </span>
                        </p>
                    )}
                </div>
                {adm && (
                    <Link href={`/nursing/${admissionId}/vitals`}>
                        <Button variant="outline" size="sm">
                            View Vitals
                        </Button>
                    </Link>
                )}
            </div>

            <div className="mt-8">
                {/* Re-using the exact notes panel we just upgraded with Edit/Delete */}
                <NotesPanel admissionId={admissionId} />
            </div>
        </div>
    )
}
