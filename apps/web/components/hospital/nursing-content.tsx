"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getAdmittedAdmissions } from "@/lib/store/admission-store"
import { getLatestVital } from "@/lib/store/vitals-store"
import { BedDouble, Search, Activity, Heart, Wind, Thermometer, ChevronRight, Clock } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

const DEPT_COLOR: Record<string, string> = {
    PICU: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    Surgery: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
    General: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
}

export function NursingContent() {
    const [search, setSearch] = useState("")
    const admissions = getAdmittedAdmissions()

    const filtered = admissions.filter(a =>
        a.patientName.toLowerCase().includes(search.toLowerCase()) ||
        a.patientId.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex-1 space-y-6 p-6 pt-4">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nursing Station</h1>
                <p className="text-muted-foreground text-sm mt-0.5">
                    Monitor admitted patients — chart vitals and log fluid I/O
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map(adm => {
                    const latest = getLatestVital(adm.id)
                    const deptColor = DEPT_COLOR[adm.department] ?? "bg-gray-100 text-gray-700"
                    return (
                        <Card key={adm.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-base">{adm.patientName}</p>
                                        <p className="text-xs text-muted-foreground">{adm.patientId}</p>
                                    </div>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${deptColor}`}>
                                        {adm.department}
                                    </span>
                                </div>
                                {adm.currentLocation && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                        <BedDouble className="h-3.5 w-3.5" />
                                        {adm.currentLocation.wardName} / <strong>{adm.currentLocation.bedNumber}</strong>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
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
                                    <div className="bg-muted/40 rounded-lg p-3 text-center text-xs text-muted-foreground">
                                        No vitals charted yet
                                    </div>
                                )}
                                {latest && (
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        Last charted {formatDistanceToNow(new Date(latest.timestamp), { addSuffix: true })}
                                        {" "}by {latest.recordedBy}
                                    </div>
                                )}
                                <Link href={`/nursing/${adm.id}/vitals`}>
                                    <Button variant="secondary" size="sm" className="w-full gap-2 mt-1">
                                        <Activity className="h-4 w-4" />
                                        View Vitals & I/O Chart
                                        <ChevronRight className="h-3 w-3 ml-auto" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )
                })}
                {filtered.length === 0 && (
                    <div className="col-span-full text-center text-muted-foreground py-12">
                        No admitted patients found.
                    </div>
                )}
            </div>
        </div>
    )
}
