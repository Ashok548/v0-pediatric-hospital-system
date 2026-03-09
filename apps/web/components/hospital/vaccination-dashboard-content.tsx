"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
    Syringe,
    Search,
    Clock,
    CheckCircle2,
    AlertTriangle,
    CalendarDays,
    Baby,
    ChevronRight,
    ShieldCheck,
    ShieldAlert,
    X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useVaccinationDashboard } from "@/lib/api/vaccinations"

// ─── Types ─────────────────────────────────────────────────────────────────
type VaxStatus = "Due Today" | "Upcoming" | "Missed" | "Up to Date"

interface VaccinationPatient {
    id: string
    uhid: string
    name: string
    dob: string
    age: string
    gender: "M" | "F"
    guardian: string
    doctor: string
    completedCount: number
    totalCount: number
    nextVaccine: string
    nextDate: string
    status: VaxStatus
}

// ─── Mock Data Removed in favor of real API ──────────────────────────────

const statusConfig: Record<VaxStatus, { className: string; icon: React.ElementType }> = {
    "Due Today": { className: "bg-[#e8f4fd] text-[#1a6fb5] border-[#bcddf5]", icon: Clock },
    Upcoming: { className: "bg-[#e6f6ee] text-[#1a7a4c] border-[#b4e4cb]", icon: CalendarDays },
    Missed: { className: "bg-[#fde8e8] text-[#c53030] border-[#f5bcbc]", icon: AlertTriangle },
    "Up to Date": { className: "bg-[#f5f5f5] text-[#616161] border-[#e0e0e0]", icon: ShieldCheck },
}

function getInitials(name: string) {
    const parts = name.split(" ")
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name[0].toUpperCase()
}

// ─── Component ──────────────────────────────────────────────────────────────
export function VaccinationDashboardContent() {
    const { patients: vaccinationPatients, isLoading } = useVaccinationDashboard()
    const [statusFilter, setStatusFilter] = useState<VaxStatus | "all">("all")
    const [search, setSearch] = useState("")

    const counts = useMemo(() => ({
        "Due Today": vaccinationPatients?.filter((p: any) => p.status === "Due Today").length || 0,
        Missed: vaccinationPatients?.filter((p: any) => p.status === "Missed").length || 0,
        Upcoming: vaccinationPatients?.filter((p: any) => p.status === "Upcoming").length || 0,
        "Up to Date": vaccinationPatients?.filter((p: any) => p.status === "Up to Date").length || 0,
    }), [vaccinationPatients])

    const filtered = useMemo(() => {
        if (!vaccinationPatients) return []
        const q = search.toLowerCase()
        return vaccinationPatients.filter((p: any) => {
            if (statusFilter !== "all" && p.status !== statusFilter) return false
            if (q && !p.name.toLowerCase().includes(q) && !p.uhid.toLowerCase().includes(q) && !p.guardian.toLowerCase().includes(q)) return false
            return true
        })
    }, [statusFilter, search, vaccinationPatients])

    // Today's schedule = due today patients sorted by missed first
    const todaySchedule = vaccinationPatients?.filter((p: any) => p.status === "Due Today" || p.status === "Missed") || []

    return (
        <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1600px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-foreground tracking-tight">Vaccination</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        22 Feb 2026 &middot; {vaccinationPatients?.length || 0} patients on vaccination programme
                    </p>
                </div>
                <Button className="gap-2 shrink-0">
                    <Syringe className="size-4" />
                    Record Vaccination
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Due Today", value: counts["Due Today"], icon: Clock, iconColor: "text-[#1a6fb5]", iconBg: "bg-[#e8f4fd]", filter: "Due Today" as VaxStatus },
                    { label: "Missed", value: counts["Missed"], icon: ShieldAlert, iconColor: "text-[#c53030]", iconBg: "bg-[#fde8e8]", filter: "Missed" as VaxStatus },
                    { label: "Upcoming (30d)", value: counts["Upcoming"], icon: CalendarDays, iconColor: "text-[#1a7a4c]", iconBg: "bg-[#e6f6ee]", filter: "Upcoming" as VaxStatus },
                    { label: "Up to Date", value: counts["Up to Date"], icon: ShieldCheck, iconColor: "text-primary", iconBg: "bg-primary/10", filter: "Up to Date" as VaxStatus },
                ].map(stat => (
                    <button
                        key={stat.label}
                        onClick={() => setStatusFilter(statusFilter === stat.filter ? "all" : stat.filter)}
                        className={cn(
                            "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left",
                            statusFilter === stat.filter
                                ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                                : "border-border bg-card hover:border-primary/20"
                        )}
                    >
                        <div className={cn("flex items-center justify-center size-10 rounded-lg shrink-0", stat.iconBg)}>
                            <stat.icon className={cn("size-5", stat.iconColor)} />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
                            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Today's Schedule Alert */}
            {todaySchedule.length > 0 && (statusFilter === "all" || statusFilter === "Due Today" || statusFilter === "Missed") && (
                <Card className="py-0 border-primary/20 bg-primary/[0.02]">
                    <CardHeader className="px-4 pt-4 pb-2 flex-row items-center gap-2">
                        <Clock className="size-4 text-primary shrink-0" />
                        <CardTitle className="text-sm font-semibold text-foreground">
                            Today&apos;s Vaccination Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                        <div className="flex flex-col gap-2">
                            {todaySchedule.map((p: any) => (
                                <Link
                                    key={p.id}
                                    href={`/vaccination/${p.id}`}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-primary/[0.02] transition-all group"
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <Avatar className="size-7 shrink-0">
                                            <AvatarFallback className={cn(
                                                "text-[10px] font-semibold",
                                                p.gender === "F" ? "bg-[#fce4ec] text-[#c2185b]" : "bg-[#e3f2fd] text-[#1565c0]"
                                            )}>
                                                {getInitials(p.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                                            <p className="text-[11px] text-muted-foreground">{p.nextVaccine}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusConfig[p.status as VaxStatus]?.className)}>
                                            {p.status}
                                        </Badge>
                                        <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-wrap gap-2">
                    {(["all", "Due Today", "Missed", "Upcoming", "Up to Date"] as const).map(s => {
                        const isActive = statusFilter === s
                        const count = s === "all" ? vaccinationPatients.length : counts[s]
                        return (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(isActive && s !== "all" ? "all" : s)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                                    isActive ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                )}
                            >
                                {s === "all" ? "All Patients" : s}
                                <span className={cn(
                                    "flex items-center justify-center size-5 rounded-full text-[10px] font-bold",
                                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>
                <div className="relative sm:w-64 ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                        type="search"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search patient or UHID..."
                        className="w-full h-9 pl-9 pr-8 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Patient Vaccination Table */}
            <Card className="py-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="border-b border-border bg-muted/40">
                                {["Patient", "Age / DOB", "Doctor", "Completed", "Next Vaccine", "Status", ""].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-14">
                                        <div className="flex flex-col items-center gap-2">
                                            <Baby className="size-9 text-muted-foreground/30" />
                                            <p className="text-sm text-muted-foreground">No patients found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((p: any) => {
                                    const sc = statusConfig[p.status as VaxStatus] || statusConfig["Up to Date"]
                                    const StatusIcon = sc.icon
                                    const pct = Math.round((p.completedCount / p.totalCount) * 100)
                                    return (
                                        <tr
                                            key={p.id}
                                            className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors group cursor-pointer"
                                        >
                                            <td className="px-4 py-3">
                                                <Link href={`/vaccination/${p.id}`} className="flex items-center gap-2.5">
                                                    <Avatar className="size-8 shrink-0">
                                                        <AvatarFallback className={cn(
                                                            "text-[11px] font-semibold",
                                                            p.gender === "F" ? "bg-[#fce4ec] text-[#c2185b]" : "bg-[#e3f2fd] text-[#1565c0]"
                                                        )}>
                                                            {getInitials(p.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                                                        <p className="text-[11px] text-muted-foreground">{p.uhid} &middot; {p.guardian}</p>
                                                    </div>
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm text-foreground">{p.age}</p>
                                                <p className="text-[11px] text-muted-foreground">{p.dob}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm text-muted-foreground">{p.doctor}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-1 w-24">
                                                    <div className="flex items-center justify-between text-[11px]">
                                                        <span className="text-foreground font-medium">{p.completedCount}/{p.totalCount}</span>
                                                        <span className="text-muted-foreground">{pct}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-[#22a06b] transition-all"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-xs text-foreground">{p.nextVaccine}</p>
                                                {p.nextDate !== "—" && (
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">{p.nextDate}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full gap-1", sc.className)}>
                                                    <StatusIcon className="size-3" />
                                                    {p.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link href={`/vaccination/${p.id}`}>
                                                    <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary h-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        View Record
                                                        <ChevronRight className="size-3.5" />
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
                    <p className="text-xs text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {vaccinationPatients?.length || 0} patients
                    </p>
                </div>
            </Card>
        </div>
    )
}
