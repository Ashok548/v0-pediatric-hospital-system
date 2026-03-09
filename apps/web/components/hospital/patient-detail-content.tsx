"use client"

import React from "react"
import Link from "next/link"
import {
    Baby,
    CalendarDays,
    User2,
    Phone,
    FileText,
    TrendingUp,
    LogOut,
    ChevronRight,
    ClipboardList,
    Syringe,
    Activity,
    UserPlus,
    CreditCard,
    Loader2,
    MapPin,
    Mail,
    BedDouble,
    ArrowRightLeft,
    XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useQuery } from "@/hooks/use-query"
import { usePatientAdmissions } from "@/lib/api/admissions"
import { usePatientLabOrders } from "@/lib/api/labs"
import { usePatientVaccinations } from "@/lib/api/vaccinations"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiPatient {
    id: string
    uhid: string
    firstName: string
    lastName: string
    gender: "MALE" | "FEMALE" | "OTHER"
    dateOfBirth: string
    bloodGroup: string | null
    phone: string
    email: string | null
    guardianName: string
    guardianPhone: string | null
    guardianRelationship: string | null
    birthWeight: string | null  // Prisma Decimal serializes as string in JSON
    address: string | null
    city: string | null
    state: string | null
    pincode: string | null
    abhaId: string | null
    status: "ACTIVE" | "INACTIVE"
    createdAt: string
    updatedAt: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcAgeDisplay(dateOfBirth: string): string {
    const dob = new Date(dateOfBirth)
    const now = new Date()
    let years = now.getFullYear() - dob.getFullYear()
    let months = now.getMonth() - dob.getMonth()
    let days = now.getDate() - dob.getDate()
    if (days < 0) { months--; days += 30 }
    if (months < 0) { years--; months += 12 }
    if (years === 0 && months === 0) return `${days} days`
    if (years === 0) return `${months} month${months !== 1 ? "s" : ""}`
    return `${years}y ${months}mo`
}

function formatDob(dateOfBirth: string): string {
    return new Date(dateOfBirth).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
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
        description: "Discharge notes with digital signature and PDF export.",
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

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function DetailSkeleton() {
    return (
        <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1100px] mx-auto">
            <Skeleton className="h-4 w-24" />
            <Card className="py-0">
                <CardContent className="px-5 py-5 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="size-14 rounded-full" />
                        <div className="flex flex-col gap-2 flex-1">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-3 w-64" />
                            <Skeleton className="h-3 w-40" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────
export function PatientDetailContent({ patientId }: { patientId: string }) {
    const { data: patient, isLoading, error } = useQuery<ApiPatient>(`/patients/${patientId}`)
    const { admissions: admissionHistory, isLoading: admLoading } = usePatientAdmissions(patient?.id ?? null)
    const { orders: labOrders } = usePatientLabOrders(patient?.id ?? null)
    const { schedule: vaccineSchedule } = usePatientVaccinations(patient?.id ?? null)

    // Loading state
    if (isLoading) return <DetailSkeleton />

    // Error / not found
    if (error || !patient) {
        return (
            <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[900px] mx-auto">
                <Link href="/patients" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                    ← Patients
                </Link>
                <div className="flex flex-col items-center justify-center py-24 gap-3">
                    <Baby className="size-12 text-muted-foreground/30" />
                    <p className="text-sm font-medium text-muted-foreground">
                        {error ? "Failed to load patient" : "Patient not found"}
                    </p>
                    <p className="text-xs text-muted-foreground/70 font-mono">{patientId}</p>
                    <Link href="/patients" className="text-sm text-primary hover:underline">Back to Patient List</Link>
                </div>
            </div>
        )
    }

    const fullName = `${patient.firstName} ${patient.lastName}`
    const age = calcAgeDisplay(patient.dateOfBirth)
    const dob = formatDob(patient.dateOfBirth)
    const genderLabel = patient.gender === "MALE" ? "Male" : patient.gender === "FEMALE" ? "Female" : "Other"
    const isNeonatal = age.includes("day") || age.includes("month")

    return (
        <>
            <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1100px] mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/patients" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                        ← Patients
                    </Link>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-foreground font-medium">{fullName}</span>
                </div>

                {/* ── Patient Header Card ─────────────────────────────────────────── */}
                <Card className="py-0">
                    <CardContent className="px-5 py-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className={cn(
                                    "flex items-center justify-center size-14 rounded-full shrink-0",
                                    patient.gender === "FEMALE" ? "bg-[#fce4ec]" : isNeonatal ? "bg-[#fde8e8]" : "bg-[#e3f2fd]"
                                )}>
                                    <Baby className={cn(
                                        "size-7",
                                        patient.gender === "FEMALE" ? "text-[#c2185b]" : isNeonatal ? "text-[#c53030]" : "text-[#1565c0]"
                                    )} />
                                </div>

                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                        <h1 className="text-lg font-bold text-foreground tracking-tight">{fullName}</h1>
                                        <Badge variant="secondary" className="text-[11px] font-mono">{patient.uhid}</Badge>
                                        <Badge variant="outline" className={cn(
                                            "text-[11px] font-semibold px-2.5 py-0.5 rounded-full",
                                            patient.status === "ACTIVE"
                                                ? "bg-[#e6f6ee] text-[#1a7a4c] border-[#b4e4cb]"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {patient.status === "ACTIVE" ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1"><CalendarDays className="size-3" />DOB: {dob}</span>
                                        <span className="flex items-center gap-1"><User2 className="size-3" />{age} · {genderLabel}</span>
                                        {patient.bloodGroup && (
                                            <span className="flex items-center gap-1 font-medium text-foreground">🩸 {patient.bloodGroup}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                        <span>Guardian: {patient.guardianName}{patient.guardianRelationship ? ` (${patient.guardianRelationship})` : ""}</span>
                                        <span className="flex items-center gap-1"><Phone className="size-3" />{patient.phone}</span>
                                        {patient.guardianPhone && <span className="flex items-center gap-1"><Phone className="size-3" />{patient.guardianPhone}</span>}
                                        {patient.email && <span className="flex items-center gap-1"><Mail className="size-3" />{patient.email}</span>}
                                    </div>
                                    {(patient.address || patient.city || patient.state) && (
                                        <p className="flex items-start gap-1 text-xs text-muted-foreground">
                                            <MapPin className="size-3 shrink-0 mt-0.5" />
                                            {[patient.address, patient.city, patient.state, patient.pincode].filter(Boolean).join(", ")}
                                        </p>
                                    )}
                                    {patient.abhaId && (
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <CreditCard className="size-3" />ABHA: <span className="font-mono text-foreground">{patient.abhaId}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Quick stats */}
                            <div className="flex flex-wrap gap-2 shrink-0">
                                {[
                                    { label: "Blood Group", value: patient.bloodGroup ?? "—" },
                                    { label: "Birth Weight", value: patient.birthWeight ? `${patient.birthWeight} kg` : "—" },
                                    { label: "Age", value: age },
                                ].map(v => (
                                    <div key={v.label} className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/30 px-3 py-2 min-w-[80px]">
                                        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{v.label}</span>
                                        <span className="text-sm font-bold text-foreground">{v.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Admit button */}
                        {patient.status === "ACTIVE" && (
                            <div className="mt-4 flex items-center gap-3">
                                <Link href={`/admissions/new?patientId=${patient.id}`}>
                                    <Button size="sm" className="gap-2">
                                        <UserPlus className="size-4" />
                                        Admit to Ward
                                    </Button>
                                </Link>
                                {isNeonatal && (
                                    <Link href={`/admissions/new?patientId=${patient.id}&department=NICU`}>
                                        <Button size="sm" variant="outline"
                                            className="gap-2 border-[#f5bcbc] text-[#c53030] hover:bg-[#fde8e8] hover:text-[#c53030]">
                                            <Baby className="size-4" />
                                            Admit to NICU
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}

                        {/* Registration info */}
                        <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 px-4 py-2.5">
                            <ClipboardList className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Registration Info</span>
                                <span className="text-sm font-medium text-foreground">Registered on {formatDob(patient.createdAt)}</span>
                                {patient.guardianPhone && (
                                    <span className="text-[11px] text-muted-foreground">
                                        Guardian alt. contact: {patient.guardianPhone}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Clinical Actions ───────────────────────────────────────────── */}
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

                {/* ── Admission History ──────────────────────────────────────────── */}
                <Card className="py-0">
                    <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                            <BedDouble className="size-4 text-primary" />
                            Admission History
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-5 py-4">
                        {admLoading && (
                            <div className="space-y-3">
                                {[0, 1].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                            </div>
                        )}
                        {!admLoading && admissionHistory.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-6">No admissions on record.</p>
                        )}
                        {!admLoading && admissionHistory.map(a => (
                            <div key={a.id} className="flex items-center justify-between gap-3 py-3 border-b last:border-0">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "p-2 rounded-full shrink-0",
                                        a.status === "ADMITTED" ? "bg-green-100 text-green-700 dark:bg-green-900/40" :
                                            a.status === "DISCHARGED" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40" :
                                                "bg-muted text-muted-foreground"
                                    )}>
                                        {a.status === "DISCHARGED" ? <LogOut className="size-3.5" /> : <BedDouble className="size-3.5" />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-sm">{a.admissionNumber}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {a.department} · {new Date(a.admissionDate).toLocaleDateString("en-IN")}
                                            {a.currentBed && ` · ${a.currentBed.ward.name} / ${a.currentBed.bedNumber}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant={a.status === "ADMITTED" ? "default" : a.status === "DISCHARGED" ? "secondary" : "outline"} className="text-xs">
                                        {a.status}
                                    </Badge>
                                    {a.status === "ADMITTED" && (
                                        <Link href={`/admissions/${a.id}/transfer`}>
                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs gap-1">
                                                <ArrowRightLeft className="size-3" />
                                            </Button>
                                        </Link>
                                    )}
                                    {(a.status === "ADMITTED" || a.status === "BED_ASSIGNED") && (
                                        <Link href={`/admissions/${a.id}/discharge`}>
                                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-destructive gap-1">
                                                <XCircle className="size-3" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* ── Connected EMR Modules Preview ─────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Labs Mini Card */}
                    <Card className="py-0">
                        <CardHeader className="px-5 pt-4 pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Activity className="size-4 text-primary" /> Recent Labs
                                </span>
                                <Link href={`/lab`} className="text-xs text-primary hover:underline">View All</Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 pb-4 pt-0">
                            {labOrders.length === 0 ? (
                                <p className="text-xs text-muted-foreground pt-2">No recent labs.</p>
                            ) : (
                                <div className="flex flex-col gap-2 pt-2">
                                    {labOrders.slice(0, 3).map((order: any) => (
                                        <div key={order.id} className="flex justify-between items-center text-xs border-b last:border-0 pb-2 last:pb-0">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{order.orderNumber}</span>
                                                <span className="text-muted-foreground">{new Date(order.orderDate).toLocaleDateString()}</span>
                                            </div>
                                            <Badge variant={order.status === "FINALIZED" ? "secondary" : "outline"} className="text-[10px]">
                                                {order.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Vaccines Mini Card */}
                    <Card className="py-0">
                        <CardHeader className="px-5 pt-4 pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Syringe className="size-4 text-primary" /> Vaccination Progress
                                </span>
                                <Link href={`/vaccination`} className="text-xs text-primary hover:underline">View Chart</Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 pb-4 pt-0">
                            {vaccineSchedule.length === 0 ? (
                                <p className="text-xs text-muted-foreground pt-2">No schedule generated yet.</p>
                            ) : (
                                <div className="flex flex-col gap-2 pt-2">
                                    {vaccineSchedule.slice(0, 3).map((vax: any) => (
                                        <div key={vax.id} className="flex justify-between items-center text-xs border-b last:border-0 pb-2 last:pb-0">
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{vax.vaccineName}</span>
                                                <span className="text-muted-foreground">{vax.ageLabel}</span>
                                            </div>
                                            {vax.status === "COMPLETED" ? (
                                                <Badge className="text-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200">
                                                    Completed
                                                </Badge>
                                            ) : vax.status === "MISSED" ? (
                                                <Badge variant="destructive" className="text-[10px]">
                                                    Missed
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px]">
                                                    Upcoming
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    )
}
