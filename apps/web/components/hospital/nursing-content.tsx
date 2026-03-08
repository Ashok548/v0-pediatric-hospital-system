"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAdmissions } from "@/lib/api/admissions"
import { BedDouble, Search, Activity, Heart, Wind, Thermometer, ChevronRight, Clock, Loader2, FileText, LogOut } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { HandoverSheet } from "./nursing/handover-sheet"

const DEPT_COLOR: Record<string, string> = {
    NICU: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    PICU: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    Surgery: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    General: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
}

export function NursingContent() {
    const [search, setSearch] = useState("")
    const { admissions = [], isLoading } = useAdmissions({ status: "ADMITTED" }) // Only admitted patients

    const filtered = admissions.filter(a =>
        `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        a.patient.uhid.toLowerCase().includes(search.toLowerCase()) ||
        a.admissionNumber.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex-1 space-y-6 p-6 pt-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Nursing Station</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        Monitor admitted patients — chart vitals and log fluid I/O
                    </p>
                </div>
                <HandoverSheet />
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <BedDouble className="h-4 w-4" /> Currently Admitted
                        </CardTitle>
                    </CardHeader>
                    <CardContent><p className="text-2xl font-bold">{admissions.length}</p></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4 text-purple-500" /> NICU
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-purple-600">
                            {admissions.filter(a => a.department === "NICU").length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4 text-red-500" /> PICU
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-red-600">
                            {admissions.filter(a => a.department === "PICU").length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-500" /> General
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-blue-600">
                            {admissions.filter(a => a.department === "General").length}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4 text-orange-500" /> Surgery
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-orange-600">
                            {admissions.filter(a => a.department === "Surgery").length}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search patient or admission ID..."
                    className="pl-9"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Patient Cards */}
            {isLoading ? (
                <div className="flex h-40 items-center justify-center col-span-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground delay-150" />
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map(adm => {
                        // The 'vitalsRecords' relation brings back the single latest vital (if configured correctly in API)
                        // If not, we just take the first one assuming it's ordered desc in the backend.
                        const latest = (adm as any).vitalsRecords?.[0]
                        const deptColor = DEPT_COLOR[adm.department] ?? "bg-gray-100 text-gray-700"
                        const isDischargePending = (adm as any).dischargeStatus === "IN_PROGRESS"
                        return (
                            <Card key={adm.id} className="hover:shadow-md transition-shadow flex flex-col">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-semibold text-base">{adm.patient.firstName} {adm.patient.lastName}</p>
                                            <p className="text-xs text-muted-foreground">{adm.patient.uhid}</p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${deptColor}`}>
                                            {adm.department}
                                        </span>
                                    </div>
                                    {adm.currentBed && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                            <BedDouble className="h-3.5 w-3.5" />
                                            {adm.currentBed.ward.name} / <strong>{adm.currentBed.bedNumber}</strong>
                                        </div>
                                    )}
                                    {isDischargePending && (
                                        <div className="mt-2">
                                            <Link href={`/admissions/${adm.id}/discharge`}>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5 hover:bg-amber-200 transition-colors">
                                                    <LogOut className="h-3 w-3" /> Discharge Clearance Pending
                                                </span>
                                            </Link>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-3 flex-1 flex flex-col">
                                    {/* Latest Vitals */}
                                    {latest ? (
                                        <div className="grid grid-cols-3 gap-2 bg-muted/40 rounded-lg p-3">
                                            <div className="flex flex-col items-center gap-0.5">
                                                <Heart className="h-3.5 w-3.5 text-red-500" />
                                                <span className="text-sm font-bold">{latest.heartRate}</span>
                                                <span className="text-[10px] text-muted-foreground">HR</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5">
                                                <Wind className="h-3.5 w-3.5 text-blue-500" />
                                                <span className="text-sm font-bold">{latest.spo2}%</span>
                                                <span className="text-[10px] text-muted-foreground">SpO2</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-0.5">
                                                <Thermometer className="h-3.5 w-3.5 text-orange-500" />
                                                <span className="text-sm font-bold">{latest.temperature}°</span>
                                                <span className="text-[10px] text-muted-foreground">Temp</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-muted/40 rounded-lg p-3 text-center text-xs text-muted-foreground h-[68px] flex items-center justify-center">
                                            No vitals charted yet
                                        </div>
                                    )}
                                    {latest && (
                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            Last charted {formatDistanceToNow(new Date(latest.recordedAt), { addSuffix: true })}
                                            {" "}by {latest.recordedBy}
                                        </div>
                                    )}
                                    <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
                                        <Link href={`/nursing/${adm.id}/vitals`}>
                                            <Button variant="secondary" size="sm" className="w-full gap-2">
                                                <Activity className="h-4 w-4" />
                                                Vitals & Charting
                                            </Button>
                                        </Link>
                                        <Link href={`/nursing/${adm.id}/notes`}>
                                            <Button variant="outline" size="sm" className="w-full gap-2 text-muted-foreground">
                                                <FileText className="h-4 w-4" />
                                                View Notes
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                    {!isLoading && filtered.length === 0 && (
                        <div className="col-span-full text-center text-muted-foreground py-12">
                            No admitted patients found.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
