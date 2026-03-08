"use client"

// ─── Improvement #5 ───────────────────────────────────────────────────────────
// PatientVisitSelector: replaces hardcoded mock patient in OPBillingForm.
// Shows today's appointments (Scheduled/In Progress/Completed) as selectable rows.

import { useState, useMemo } from "react"
import { useAppointments } from "@/lib/api/appointments"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectedVisit {
    visitId: string
    patientName: string
    uhid: string
    doctor: string
    department: string
    age: string
    gender: 'M' | 'F'
}

const statusStyle: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    Completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
    "In Progress": { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
    Scheduled: { label: "Scheduled", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
}

// Filter to billable visits (show only non-cancelled, non-no-show)
const BILLABLE_STATUSES = ["Completed", "In Progress", "Scheduled"]

export function PatientVisitSelector({
    onSelect
}: {
    onSelect: (visit: SelectedVisit) => void
}) {
    const [search, setSearch] = useState("")
    const todayISO = useMemo(() => new Date().toISOString(), [])
    const { appointments = [], isLoading } = useAppointments({ date: todayISO })

    const filtered = appointments
        .filter(a => BILLABLE_STATUSES.includes(a.status))
        .filter(a => search
            ? a.patientName.toLowerCase().includes(search.toLowerCase()) ||
            a.uhid.toLowerCase().includes(search.toLowerCase()) ||
            (a.doctor && a.doctor.toLowerCase().includes(search.toLowerCase()))
            : true
        )

    return (
        <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-base font-semibold">Select Patient Visit</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        className="pl-9"
                        placeholder="Search by name, UHID, or doctor..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                {/* Visit Rows */}
                <div className="border rounded-md overflow-hidden divide-y max-h-72 overflow-y-auto">
                    {isLoading ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Loading visits...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            No matching visits found.
                        </div>
                    ) : (
                        filtered.map(appt => {
                            const s = statusStyle[appt.status] ?? statusStyle["Scheduled"]
                            const Icon = s.icon
                            return (
                                <button
                                    key={appt.id}
                                    onClick={() => onSelect({
                                        visitId: appt.id,
                                        patientName: appt.patientName,
                                        uhid: appt.uhid,
                                        doctor: appt.doctor || "",
                                        department: appt.department,
                                        age: appt.age,
                                        gender: appt.gender as 'M' | 'F'
                                    })}
                                    className="w-full px-4 py-3 text-left hover:bg-muted/40 transition-colors flex items-center justify-between gap-4 group"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                                                appt.gender === "F" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {appt.patientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{appt.patientName}</p>
                                                <p className="text-[11px] text-muted-foreground">{appt.uhid} &middot; {appt.age} &middot; Token #{appt.token}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 pl-9">{appt.doctor} &middot; {appt.department}</p>
                                    </div>
                                    <Badge variant="outline" className={cn("flex items-center gap-1", s.className)}>
                                        <Icon className="size-3" />
                                        {s.label}
                                    </Badge>
                                </button>
                            )
                        })
                    )}
                </div>
                {!isLoading && (
                    <p className="text-[11px] text-muted-foreground">Showing {filtered.length} visits &middot; Today</p>
                )}
            </CardContent>
        </Card>
    )
}
