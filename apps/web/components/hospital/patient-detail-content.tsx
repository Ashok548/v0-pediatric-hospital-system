"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
    Baby,
    CalendarDays,
    User2,
    Stethoscope,
    Phone,
    Bed,
    FileText,
    TrendingUp,
    LogOut,
    ChevronRight,
    ClipboardList,
    Syringe,
    Activity,
    Clock,
    UserPlus,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    History,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { getPatientDetail, subscribe, admitToWard } from "@/lib/store/patients"
import { addNicuBaby } from "@/lib/store/nicu"
import { updatePatientStatus } from "@/lib/store/patients"
import { usePatientActivity } from "@/lib/store/activity-store"
import { appointments } from "@/lib/data/appointments"
import type { PatientStatus, ApptStatus, PatientDetail, BabyStatus } from "@carenest/shared-types"

// ─── Status Config ─────────────────────────────────────────────────
// Patient detail data is now imported from @/lib/data/patients

const statusConfig: Record<PatientStatus, { label: string; className: string }> = {
    OP: { label: "OP", className: "bg-[#e8f4fd] text-[#1a6fb5] border-[#bcddf5]" },
    IP: { label: "IP", className: "bg-[#fef3cd] text-[#856404] border-[#ffeaa0]" },
    NICU: { label: "NICU", className: "bg-[#fde8e8] text-[#c53030] border-[#f5bcbc]" },
    Discharged: { label: "Discharged", className: "bg-[#e6f6ee] text-[#1a7a4c] border-[#b4e4cb]" },
}

// ─── Feature Cards ──────────────────────────────────────────────────────────
const features = [
    {
        key: "prescription",
        label: "Prescription",
        description: "Write & manage prescriptions, check drug interactions and weight-based dosing.",
        icon: FileText,
        iconBg: "bg-primary/10",
        iconColor: "text-primary",
        href: (id: string) => `/patients/${id}/prescription`,
    },
    {
        key: "growth",
        label: "Growth Tracking",
        description: "WHO-aligned weight, height and head circumference percentile charts.",
        icon: TrendingUp,
        iconBg: "bg-[#e6f6ee]",
        iconColor: "text-[#1a7a4c]",
        href: (id: string) => `/patients/${id}/growth`,
    },
    {
        key: "discharge",
        label: "Discharge Summary",
        description: "AI-assisted discharge notes with digital signature and PDF export.",
        icon: LogOut,
        iconBg: "bg-[#fef3cd]",
        iconColor: "text-[#856404]",
        href: (id: string) => `/patients/${id}/discharge`,
    },
    {
        key: "vaccination",
        label: "Vaccination Record",
        description: "IAP immunisation schedule, status tracking and catch-up alerts.",
        icon: Syringe,
        iconBg: "bg-[#e8f4fd]",
        iconColor: "text-[#1a6fb5]",
        href: () => `/vaccination`,
    },
    {
        key: "appointments",
        label: "Appointments",
        description: "View and book OPD appointments, follow-ups and procedure slots.",
        icon: CalendarDays,
        iconBg: "bg-[#f0fdf4]",
        iconColor: "text-[#15803d]",
        href: () => `/appointments`,
    },
]

const WARDS = ["Paediatric General Ward", "PICU", "Surgical Ward", "Day Care"]

// ─── Admit Ward Sheet ────────────────────────────────────────────────────────
function AdmitWardSheet({ patient, onClose }: { patient: PatientDetail, onClose: () => void }) {
    const [ward, setWard] = useState("")
    const [bed, setBed] = useState("")
    const [doctor, setDoctor] = useState(patient.doctor || "Dr. Priya Reddy")
    const [diagnosis, setDiagnosis] = useState(patient.diagnosis || "")
    const [date, setDate] = useState(new Date().toISOString().split("T")[0])
    const [error, setError] = useState("")

    function handleConfirm() {
        if (!ward) return setError("Please select a ward")
        if (!bed.trim()) return setError("Please enter a bed number")
        setError("")
        const formattedDate = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        admitToWard(patient.uhid, `${ward} / Bed ${bed.trim()}`, doctor, diagnosis, formattedDate)
        onClose()
    }

    const inputCls = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"

    return (
        <div className="flex flex-col gap-5 p-1 mt-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Select Ward</label>
                <div className="grid grid-cols-2 gap-2">
                    {WARDS.map(w => (
                        <button key={w} type="button" onClick={() => setWard(w)}
                            className={cn("px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all",
                                ward === w ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40 text-foreground")}>
                            {w}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Bed Number</label>
                <div className="relative">
                    <Bed className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input value={bed} onChange={e => setBed(e.target.value)} placeholder="e.g. B-03" className={cn(inputCls, "pl-9")} />
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Attending Doctor</label>
                <input value={doctor} onChange={e => setDoctor(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Admitting Diagnosis</label>
                <input value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Admission Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} />
            </div>

            {error && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 shrink-0" />{error}
                </p>
            )}

            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button className="flex-1 gap-2" onClick={handleConfirm}>
                    <ArrowRight className="size-4" />Admit Patient
                </Button>
            </div>
        </div>
    )
}

// ─── Admit NICU Sheet ────────────────────────────────────────────────────────
function AdmitNicuSheet({ patient, onClose }: { patient: PatientDetail, onClose: () => void }) {
    const [bed, setBed] = useState("")
    const [weight, setWeight] = useState(patient.weight || "2.5 kg")
    const [gest, setGest] = useState("38 weeks")
    const [status, setStatus] = useState<BabyStatus>("stable")
    const [doctor, setDoctor] = useState(patient.doctor || "Dr. Meena Iyer")
    const [error, setError] = useState("")

    function handleConfirm() {
        if (!bed.trim()) return setError("Please enter an incubator/bed number")
        setError("")

        const vitals = { heartRate: 140, spo2: 98, temperature: 36.5 }
        const alerts = status === "critical" ? ["Continuous Monitoring Required"] : []
        const formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

        addNicuBaby({
            id: patient.uhid,
            name: patient.name,
            bed: bed.trim(),
            gestationalAge: gest,
            weight,
            status,
            vitals,
            alerts,
            admittedDate: formattedDate,
            doctor
        })

        updatePatientStatus(patient.uhid, "NICU", `NICU / Bed ${bed.trim()}`)
        onClose()
    }

    const inputCls = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"

    return (
        <div className="flex flex-col gap-5 p-1 mt-4">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Incubator / Bed No.</label>
                <input value={bed} onChange={e => setBed(e.target.value)} placeholder="e.g. N-15" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Gestational Age</label>
                <input value={gest} onChange={e => setGest(e.target.value)} placeholder="e.g. 34 weeks + 2 days" className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Birth Weight</label>
                <input value={weight} onChange={e => setWeight(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Initial Status</label>
                <div className="flex items-center gap-2">
                    {(["stable", "warning", "critical"] as BabyStatus[]).map(s => (
                        <button key={s} type="button" onClick={() => setStatus(s)}
                            className={cn("px-4 py-1.5 rounded-full text-xs font-semibold border capitalize transition-all",
                                status === s
                                    ? s === "stable" ? "bg-[#e6f6ee] text-[#1a7a4c] border-[#1a7a4c]"
                                        : s === "warning" ? "bg-[#fff8e1] text-[#b45309] border-[#b45309]"
                                            : "bg-[#fde8e8] text-[#c53030] border-[#c53030]"
                                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                            )}>
                            {s}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Attending Doctor</label>
                <input value={doctor} onChange={e => setDoctor(e.target.value)} className={inputCls} />
            </div>

            {error && (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 shrink-0" />{error}
                </p>
            )}

            <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleConfirm}>
                    <Baby className="size-4" />Admit to NICU
                </Button>
            </div>
        </div>
    )
}

// ─── Component ──────────────────────────────────────────────────────────────
export function PatientDetailContent({ patientId }: { patientId: string }) {
    const [patient, setPatient] = useState<PatientDetail | undefined>(getPatientDetail(patientId))
    const [admitWardOpen, setAdmitWardOpen] = useState(false)
    const [admitNicuOpen, setAdmitNicuOpen] = useState(false)
    const activityLog = usePatientActivity(patientId)

    useEffect(() => {
        // Keep synced with store
        setPatient(getPatientDetail(patientId))
        const unsub = subscribe(() => setPatient(getPatientDetail(patientId)))
        return unsub
    }, [patientId])

    // Fallback for unknown UHID
    if (!patient) {
        return (
            <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[900px] mx-auto">
                <Link href="/patients" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                    ← Patients
                </Link>
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Baby className="size-12 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">Patient not found: <code className="font-mono">{patientId}</code></p>
                    <Link href="/patients" className="text-sm text-primary hover:underline">Back to Patient List</Link>
                </div>
            </div>
        )
    }

    const sc = statusConfig[patient.status]

    return (
        <>
            <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1100px] mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/patients" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        ← Patients
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground font-medium">{patient.name}</span>
                </div>

                {/* ── Patient Header Card ──────────────────────────────────────────── */}
                <Card className="py-0">
                    <CardContent className="px-5 py-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "flex items-center justify-center size-14 rounded-full shrink-0",
                                    patient.gender === "F" ? "bg-[#fce4ec]" : "bg-[#e3f2fd]"
                                )}>
                                    <Baby className={cn("size-7", patient.gender === "F" ? "text-[#c2185b]" : "text-[#1565c0]")} />
                                </div>
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h1 className="text-lg font-bold text-foreground tracking-tight">{patient.name}</h1>
                                        <Badge variant="secondary" className="text-[11px] font-mono">{patient.uhid}</Badge>
                                        <Badge variant="outline" className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full", sc.className)}>
                                            {sc.label}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1"><CalendarDays className="size-3" />DOB: {patient.dob}</span>
                                        <span className="flex items-center gap-1"><User2 className="size-3" />{patient.age} · {patient.gender === "F" ? "Female" : "Male"}</span>
                                        <span className="flex items-center gap-1"><Stethoscope className="size-3" />{patient.doctor}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                        <span>Guardian: {patient.guardian}</span>
                                        <span className="flex items-center gap-1"><Phone className="size-3" />{patient.phone}</span>
                                        {patient.wardBed && <span className="flex items-center gap-1"><Bed className="size-3" />{patient.wardBed}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Vitals summary */}
                            <div className="grid grid-cols-2 gap-2 shrink-0">
                                {[
                                    { label: "Blood Group", value: patient.bloodGroup },
                                    { label: "Weight", value: patient.weight },
                                ].map(v => (
                                    <div key={v.label} className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 px-3 py-2">
                                        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{v.label}</span>
                                        <span className="text-sm font-bold text-foreground">{v.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick admission actions (only visible if OP or Discharged) */}
                        {(patient.status === "OP" || patient.status === "Discharged") && (
                            <div className="mt-4 flex items-center gap-3">
                                <Button size="sm" className="gap-2" onClick={() => setAdmitWardOpen(true)}>
                                    <UserPlus className="size-4" />
                                    Admit to Ward
                                </Button>
                                {/* If patient age is extremely young (e.g. days/weeks/months old), show NICU button */}
                                {(patient.age.includes("day") || patient.age.includes("week") || patient.age.includes("month") || patient.age === "Newborn") && (
                                    <Button size="sm" variant="outline" className="gap-2 border-[#f5bcbc] text-[#c53030] hover:bg-[#fde8e8] hover:text-[#c53030]" onClick={() => setAdmitNicuOpen(true)}>
                                        <Baby className="size-4" />
                                        Admit to NICU
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Diagnosis Banner */}
                        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 px-4 py-2.5">
                            <ClipboardList className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Diagnosis</span>
                                <span className="text-sm font-medium text-foreground">{patient.diagnosis}</span>
                                {patient.admissionDate && (
                                    <span className="text-[11px] text-muted-foreground">Admitted: {patient.admissionDate}</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Clinical Actions ─────────────────────────────────────────────── */}
                <Card className="py-0">
                    <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <Activity className="size-4 text-primary" />
                            Clinical Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {features.map(feat => (
                                <Link
                                    key={feat.key}
                                    href={feat.href(patientId)}
                                    className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-sm transition-all group"
                                >
                                    <div className={cn("flex items-center justify-center size-11 rounded-xl shrink-0", feat.iconBg)}>
                                        <feat.icon className={cn("size-5", feat.iconColor)} />
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                            {feat.label}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground leading-relaxed">
                                            {feat.description}
                                        </span>
                                    </div>
                                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* ── Appointment History ───────────────────────────────────────────── */}
                {(() => {
                    const apptStatusConfig: Record<ApptStatus, { className: string }> = {
                        Scheduled: { className: "bg-[#e8f4fd] text-[#1a6fb5] border-[#bcddf5]" },
                        "In Progress": { className: "bg-[#fff8e1] text-[#e65100] border-[#ffcc80]" },
                        Completed: { className: "bg-[#e6f6ee] text-[#1a7a4c] border-[#b4e4cb]" },
                        Cancelled: { className: "bg-[#fde8e8] text-[#c53030] border-[#f5bcbc]" },
                        "No Show": { className: "bg-[#f5f5f5] text-[#616161] border-[#e0e0e0]" },
                    }
                    const patientAppts = appointments.filter(a => a.uhid === patientId)
                    if (patientAppts.length === 0) return null
                    return (
                        <Card className="py-0">
                            <CardHeader className="px-5 pt-4 pb-3 border-b border-border flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                    <CalendarDays className="size-4 text-[#15803d]" />
                                    Appointment History
                                    <Badge variant="secondary" className="text-[10px] font-mono">{patientAppts.length}</Badge>
                                </CardTitle>
                                <Link href="/appointments" className="text-xs text-primary hover:underline">View all →</Link>
                            </CardHeader>
                            <CardContent className="px-5 py-0">
                                {patientAppts.map((a, i) => (
                                    <div key={a.id} className={cn(
                                        "flex items-center gap-3 py-3",
                                        i < patientAppts.length - 1 && "border-b border-border"
                                    )}>
                                        <div className="flex flex-col items-center justify-center min-w-12 rounded-lg bg-muted/50 border border-border py-1.5 px-2">
                                            <Clock className="size-3 text-muted-foreground mb-0.5" />
                                            <span className="text-xs font-mono font-semibold text-foreground">{a.time}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">{a.type}</p>
                                            <p className="text-[11px] text-muted-foreground">{a.doctor} · {a.department}</p>
                                        </div>
                                        <Badge variant="outline" className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", apptStatusConfig[a.status].className)}>
                                            {a.status}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )
                })()}

                {/* ── Patient Activity Timeline ────────────────────────────────────── */}
                <Card className="py-0">
                    <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <History className="size-4 text-primary" />
                            Patient Timeline
                            <Badge variant="secondary" className="text-[10px] font-mono">{activityLog.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 py-3">
                        {activityLog.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-6">No activity recorded yet.</p>
                        ) : (
                            <div className="flex flex-col gap-0">
                                {activityLog.map((entry, i) => (
                                    <div key={entry.id} className={cn(
                                        "flex items-start gap-3 py-3",
                                        i < activityLog.length - 1 && "border-b border-border"
                                    )}>
                                        <div className="flex items-center justify-center size-7 rounded-full bg-muted shrink-0 mt-0.5">
                                            <Activity className="size-3.5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">{entry.action}</p>
                                            {entry.details && <p className="text-[11px] text-muted-foreground">{entry.details}</p>}
                                            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                                                {entry.actor} · {new Date(entry.timestamp).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${entry.category === "admission" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                            entry.category === "discharge" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                                                entry.category === "billing" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                                    entry.category === "vitals" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                                                        entry.category === "pharmacy" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" :
                                                            "bg-muted text-muted-foreground"
                                            }`}>
                                            {entry.category}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Admission Sheets */}
            <Sheet open={admitWardOpen} onOpenChange={setAdmitWardOpen}>
                <SheetContent side="right" className="w-full sm:max-w-[420px] overflow-y-auto">
                    <SheetHeader className="pb-4 border-b border-border">
                        <SheetTitle className="flex items-center gap-2">
                            <UserPlus className="size-5 text-primary" />
                            Admit to Inpatient Ward
                        </SheetTitle>
                        <SheetDescription>Process admission for {patient.name}</SheetDescription>
                    </SheetHeader>
                    {patient && <AdmitWardSheet patient={patient} onClose={() => setAdmitWardOpen(false)} />}
                </SheetContent>
            </Sheet>

            <Sheet open={admitNicuOpen} onOpenChange={setAdmitNicuOpen}>
                <SheetContent side="right" className="w-full sm:max-w-[420px] overflow-y-auto">
                    <SheetHeader className="pb-4 border-b border-[#f5bcbc]">
                        <SheetTitle className="flex items-center gap-2 text-[#c53030]">
                            <Baby className="size-5" />
                            Admit to NICU
                        </SheetTitle>
                        <SheetDescription>Process NICU admission for neonate {patient.name}</SheetDescription>
                    </SheetHeader>
                    {patient && <AdmitNicuSheet patient={patient} onClose={() => setAdmitNicuOpen(false)} />}
                </SheetContent>
            </Sheet>
        </>
    )
}
