"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
    Stethoscope,
    Receipt,
    CalendarPlus,
    AlertTriangle,
    AlertCircle,
    HeartPulse,
    Thermometer,
    Wind,
    Weight,
    FlaskConical,
    BookOpen,
    Lightbulb,
    CheckCircle2,
    Clock,
    XCircle,
    PlusCircle,
    TestTube2,
    ClipboardCheck,
    Star,
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
import { usePrescriptions } from "@/lib/api/pharmacy"
import { CreateLabOrderDialog } from "./dialogs/create-lab-order-dialog"
import { createOPVisit } from "@/lib/api/op-visits"
import { createBill } from "@/lib/api/billing"

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
    birthWeight: string | null
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

function calcAgeInMonths(dateOfBirth: string): number {
    const dob = new Date(dateOfBirth)
    const now = new Date()
    return (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth())
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function formatDob(dateOfBirth: string): string {
    return new Date(dateOfBirth).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

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

// ─── Actionable Empty State ───────────────────────────────────────────────────
function ActionableEmpty({
    icon: Icon,
    message,
    actionLabel,
    actionHref,
    onAction,
}: {
    icon: React.ElementType
    message: string
    actionLabel?: string
    actionHref?: string
    onAction?: () => void
}) {
    return (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
            <div className="flex items-center justify-center size-10 rounded-full bg-muted">
                <Icon className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{message}</p>
            {actionLabel && (
                actionHref ? (
                    <Link href={actionHref}>
                        <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                            <PlusCircle className="size-3.5" />
                            {actionLabel}
                        </Button>
                    </Link>
                ) : onAction ? (
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onAction}>
                        <PlusCircle className="size-3.5" />
                        {actionLabel}
                    </Button>
                ) : null
            )}
        </div>
    )
}

// ─── Clinical Alert Banner ────────────────────────────────────────────────────
function ClinicalAlertBanner({
    patient,
    ageMonths,
    overdueVaccines,
    isNICUAdmitted,
}: {
    patient: ApiPatient
    ageMonths: number
    overdueVaccines: any[]
    isNICUAdmitted: boolean
}) {
    const alerts: { label: string; color: string; icon: React.ElementType }[] = []

    const bw = patient.birthWeight ? parseFloat(patient.birthWeight) : null
    if (bw !== null && bw < 2.5) {
        alerts.push({ label: `Low Birth Weight (${bw} kg)`, color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle })
    }
    if (isNICUAdmitted) {
        alerts.push({ label: "NICU Admission Active", color: "bg-orange-100 text-orange-700 border-orange-200", icon: BedDouble })
    }
    if (overdueVaccines.length > 0) {
        alerts.push({ label: `${overdueVaccines.length} Vaccine(s) Overdue`, color: "bg-amber-100 text-amber-700 border-amber-200", icon: Syringe })
    }
    if (ageMonths <= 1) {
        alerts.push({ label: "Neonate (<1 month)", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Baby })
    }

    if (alerts.length === 0) return null

    return (
        <div className="flex flex-wrap gap-2 py-1">
            {alerts.map((a, i) => (
                <div key={i} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold", a.color)}>
                    <a.icon className="size-3" />
                    {a.label}
                </div>
            ))}
        </div>
    )
}

// ─── Smart Suggestions Panel ──────────────────────────────────────────────────
function SmartSuggestionsPanel({
    patient,
    ageMonths,
    activeAdmission,
    overdueVaccines,
    prescriptions,
    onGenerateOP,
    patientId,
}: {
    patient: ApiPatient
    ageMonths: number
    activeAdmission: any | null
    overdueVaccines: any[]
    prescriptions: any[]
    onGenerateOP: () => void
    patientId: string
}) {
    const suggestions: {
        key: string
        icon: React.ElementType
        color: string
        message: string
        actionLabel?: string
        actionHref?: string
        onAction?: () => void
    }[] = []

    const bw = patient.birthWeight ? parseFloat(patient.birthWeight) : null
    if (bw !== null && bw < 2.5 && !activeAdmission) {
        suggestions.push({
            key: "lbw",
            icon: AlertTriangle,
            color: "text-red-600 bg-red-50",
            message: `Low birth weight (${bw} kg) detected. Consider NICU assessment or enhanced monitoring.`,
            actionLabel: "Admit to NICU",
            actionHref: `/admissions/new?patientId=${patient.id}&department=NICU`,
        })
    }
    if (overdueVaccines.length > 0) {
        suggestions.push({
            key: "vaccine",
            icon: Syringe,
            color: "text-amber-600 bg-amber-50",
            message: `${overdueVaccines.length} vaccination(s) are due or overdue for a ${ageMonths}-month-old (${overdueVaccines.slice(0, 2).map((v: any) => v.vaccineName).join(", ")}${overdueVaccines.length > 2 ? "…" : ""}).`,
            actionLabel: "View Schedule",
            actionHref: `/vaccination`,
        })
    }
    if (prescriptions.length === 0 && !activeAdmission) {
        suggestions.push({
            key: "rx",
            icon: FileText,
            color: "text-blue-600 bg-blue-50",
            message: "No prescription has been written for this patient yet.",
            actionLabel: "Write Prescription",
            actionHref: `/patients/${patientId}/prescription`,
        })
    }
    if (ageMonths <= 24 && ageMonths >= 0) {
        suggestions.push({
            key: "growth",
            icon: TrendingUp,
            color: "text-green-600 bg-green-50",
            message: `${ageMonths}-month-old child: WHO growth monitoring is recommended. Please update growth chart.`,
            actionLabel: "Update Growth Chart",
            actionHref: `/patients/${patientId}/growth`,
        })
    }

    if (suggestions.length === 0) return null

    return (
        <Card className="py-0 border-amber-200/60 bg-amber-50/20">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-amber-100">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <Lightbulb className="size-4 text-amber-500" />
                    Clinical Suggestions
                    <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 font-medium ml-1">
                        {suggestions.length} item{suggestions.length !== 1 ? "s" : ""}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-3 flex flex-col gap-3">
                {suggestions.map((s) => (
                    <div key={s.key} className={cn("flex items-start gap-3 rounded-lg px-3 py-2.5 border border-transparent", s.color.includes("red") ? "bg-red-50 border-red-100" : s.color.includes("amber") ? "bg-amber-50 border-amber-100" : s.color.includes("blue") ? "bg-blue-50 border-blue-100" : "bg-green-50 border-green-100")}>
                        <div className={cn("flex items-center justify-center size-7 rounded-full shrink-0 mt-0.5", s.color)}>
                            <s.icon className="size-3.5" />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <p className="text-xs text-foreground leading-relaxed">{s.message}</p>
                            {s.actionLabel && (
                                s.actionHref ? (
                                    <Link href={s.actionHref} className="text-xs font-semibold text-primary hover:underline w-fit">
                                        {s.actionLabel} →
                                    </Link>
                                ) : s.onAction ? (
                                    <button onClick={s.onAction} className="text-xs font-semibold text-primary hover:underline text-left w-fit">
                                        {s.actionLabel} →
                                    </button>
                                ) : null
                            )}
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

// ─── Vitals Card ──────────────────────────────────────────────────────────────
function VitalsCard({ patientId }: { patientId: string }) {
    // Vitals hook not yet available — show actionable empty state
    const vitals: null = null

    const vitalTiles = [
        { label: "Heart Rate", unit: "bpm", icon: HeartPulse, color: "text-rose-600 bg-rose-50", value: null },
        { label: "Temperature", unit: "°C", icon: Thermometer, color: "text-orange-600 bg-orange-50", value: null },
        { label: "Resp. Rate", unit: "/min", icon: Wind, color: "text-sky-600 bg-sky-50", value: null },
        { label: "SpO₂", unit: "%", icon: Activity, color: "text-blue-600 bg-blue-50", value: null },
        { label: "Weight", unit: "kg", icon: Weight, color: "text-emerald-600 bg-emerald-50", value: null },
    ]

    return (
        <Card className="py-0">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <HeartPulse className="size-4 text-rose-500" />
                        Vitals
                    </CardTitle>
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs gap-1" asChild>
                        <Link href={`/patients/${patientId}/growth`}>
                            <PlusCircle className="size-3.5" />
                            Record Vitals
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-5 py-4">
                {vitals === null ? (
                    <div className="grid grid-cols-5 gap-3">
                        {vitalTiles.map((v) => (
                            <div key={v.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/20 px-2 py-3">
                                <div className={cn("flex items-center justify-center size-8 rounded-lg", v.color)}>
                                    <v.icon className="size-4" />
                                </div>
                                <span className="text-base font-bold text-muted-foreground">—</span>
                                <span className="text-[10px] text-muted-foreground text-center leading-tight">{v.label}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-3">
                        {vitalTiles.map((v) => (
                            <div key={v.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card px-2 py-3">
                                <div className={cn("flex items-center justify-center size-8 rounded-lg", v.color)}>
                                    <v.icon className="size-4" />
                                </div>
                                <span className="text-base font-bold text-foreground">
                                    {v.value ?? "—"} <span className="text-[10px] font-normal text-muted-foreground">{v.unit}</span>
                                </span>
                                <span className="text-[10px] text-muted-foreground text-center leading-tight">{v.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ─── Workflow Action Hub ──────────────────────────────────────────────────────
function WorkflowActionHub({
    patient,
    patientId,
    fullName,
    isNeonatal,
    activeAdmission,
    opLoading,
    ipLoading,
    opError,
    ipError,
    onGenerateOP,
    onGenerateIPBill,
}: {
    patient: ApiPatient
    patientId: string
    fullName: string
    isNeonatal: boolean
    activeAdmission: any | null
    opLoading: boolean
    ipLoading: boolean
    opError: string | null
    ipError: string | null
    onGenerateOP: () => void
    onGenerateIPBill: () => void
}) {
    // Determine the primary dynamic CTA
    const primaryAction = useMemo(() => {
        if (activeAdmission) {
            return {
                label: "Order Labs",
                description: "Order investigations for admitted patient",
                color: "bg-blue-600 hover:bg-blue-700",
                icon: FlaskConical,
                href: undefined,
                isDialog: true,
            }
        }
        return {
            label: "Generate OP",
            description: "Walk-in outpatient visit",
            color: "bg-emerald-600 hover:bg-emerald-700",
            icon: Stethoscope,
            href: undefined,
            isDialog: false,
        }
    }, [activeAdmission])

    type ActionItem = {
        label: string
        description: string
        icon: React.ElementType
        iconBg: string
        iconColor: string
        href?: string
        onClick?: () => void
        disabled?: boolean
        disabledReason?: string
    }

    const groups: { title: string; icon: React.ElementType; color: string; actions: ActionItem[] }[] = [
        {
            title: "Consultation",
            icon: Stethoscope,
            color: "text-emerald-600",
            actions: [
                {
                    label: "Generate OP",
                    description: "Walk-in OPD visit + draft bill",
                    icon: Stethoscope,
                    iconBg: "bg-emerald-100",
                    iconColor: "text-emerald-700",
                    onClick: onGenerateOP,
                    disabled: opLoading || ipLoading,
                },
                {
                    label: "Book Appointment",
                    description: "Schedule OPD or follow-up",
                    icon: CalendarPlus,
                    iconBg: "bg-violet-100",
                    iconColor: "text-violet-700",
                    href: `/appointments?newFor=${patient.id}&name=${encodeURIComponent(fullName)}`,
                },
                {
                    label: "Add Prescription",
                    description: "Weight-based pediatric dosing",
                    icon: FileText,
                    iconBg: "bg-primary/10",
                    iconColor: "text-primary",
                    href: `/patients/${patientId}/prescription`,
                },
            ],
        },
        {
            title: "Monitoring & Growth",
            icon: TrendingUp,
            color: "text-green-600",
            actions: [
                {
                    label: "Growth Chart",
                    description: "WHO percentile weight/height/HC",
                    icon: TrendingUp,
                    iconBg: "bg-[#e6f6ee]",
                    iconColor: "text-[#1a7a4c]",
                    href: `/patients/${patientId}/growth`,
                },
                {
                    label: "Vaccination Record",
                    description: "IAP schedule & catch-up alerts",
                    icon: Syringe,
                    iconBg: "bg-[#e8f4fd]",
                    iconColor: "text-[#1a6fb5]",
                    href: `/vaccination`,
                },
                {
                    label: "Appointments",
                    description: "View past and upcoming visits",
                    icon: CalendarDays,
                    iconBg: "bg-[#f0fdf4]",
                    iconColor: "text-[#15803d]",
                    href: `/appointments`,
                },
            ],
        },
        {
            title: "Admission & IP",
            icon: BedDouble,
            color: "text-blue-600",
            actions: [
                {
                    label: "Admit to Ward",
                    description: "Standard inpatient admission",
                    icon: UserPlus,
                    iconBg: "bg-blue-100",
                    iconColor: "text-blue-700",
                    href: `/admissions/new?patientId=${patient.id}`,
                    disabled: !!activeAdmission,
                    disabledReason: activeAdmission ? "Already admitted" : undefined,
                },
                ...(isNeonatal ? [{
                    label: "Admit to NICU",
                    description: "Neonatal intensive care unit",
                    icon: Baby,
                    iconBg: "bg-red-100",
                    iconColor: "text-red-700",
                    href: `/admissions/new?patientId=${patient.id}&department=NICU`,
                    disabled: !!activeAdmission,
                    disabledReason: activeAdmission ? "Already admitted" : undefined,
                } as ActionItem] : []),
                {
                    label: "Generate IP Bill",
                    description: activeAdmission ? `Admission: ${activeAdmission.admissionNumber}` : "Requires active admission",
                    icon: Receipt,
                    iconBg: activeAdmission ? "bg-blue-100" : "bg-muted",
                    iconColor: activeAdmission ? "text-blue-700" : "text-muted-foreground",
                    onClick: activeAdmission ? onGenerateIPBill : undefined,
                    disabled: !activeAdmission || ipLoading,
                    disabledReason: !activeAdmission ? "No active admission" : undefined,
                },
            ],
        },
        {
            title: "Records",
            icon: ClipboardList,
            color: "text-slate-600",
            actions: [
                {
                    label: "Discharge Summary",
                    description: "Digital notes + PDF export",
                    icon: LogOut,
                    iconBg: "bg-[#fef3cd]",
                    iconColor: "text-[#856404]",
                    href: `/patients/${patientId}/discharge`,
                    disabled: !activeAdmission,
                    disabledReason: !activeAdmission ? "No active admission" : undefined,
                },
            ],
        },
    ]

    return (
        <Card className="py-0">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <ClipboardCheck className="size-4 text-primary" />
                    Clinical Workflow
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 flex flex-col gap-5">
                {/* Dynamic Primary CTA */}
                <div className="flex flex-col gap-2">
                    <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Recommended Next Step</p>
                    {primaryAction.isDialog && activeAdmission ? (
                        <CreateLabOrderDialog
                            patientId={patientId}
                            admissionId={activeAdmission.id}
                            trigger={
                                <button className={cn("flex items-center gap-3 w-full rounded-xl px-5 py-3.5 text-white transition-all", primaryAction.color)}>
                                    <div className="flex items-center justify-center size-9 rounded-lg bg-white/20 shrink-0">
                                        <primaryAction.icon className="size-5" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 text-left">
                                        <span className="text-sm font-bold">{primaryAction.label}</span>
                                        <span className="text-[11px] opacity-80">{primaryAction.description}</span>
                                    </div>
                                    <Star className="ml-auto size-4 opacity-70 shrink-0" />
                                </button>
                            }
                        />
                    ) : (
                        <button
                            onClick={onGenerateOP}
                            disabled={opLoading}
                            className={cn("flex items-center gap-3 w-full rounded-xl px-5 py-3.5 text-white transition-all", primaryAction.color, opLoading && "opacity-70 cursor-not-allowed")}
                        >
                            <div className="flex items-center justify-center size-9 rounded-lg bg-white/20 shrink-0">
                                {opLoading ? <Loader2 className="size-5 animate-spin" /> : <primaryAction.icon className="size-5" />}
                            </div>
                            <div className="flex flex-col gap-0.5 text-left">
                                <span className="text-sm font-bold">{primaryAction.label}</span>
                                <span className="text-[11px] opacity-80">{primaryAction.description}</span>
                            </div>
                            <Star className="ml-auto size-4 opacity-70 shrink-0" />
                        </button>
                    )}
                    {opError && (
                        <div className="flex items-start gap-1.5 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                            <AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
                            <p className="text-[11px] text-destructive leading-relaxed">{opError}</p>
                        </div>
                    )}
                    {ipError && (
                        <div className="flex items-start gap-1.5 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                            <AlertCircle className="size-3.5 text-destructive shrink-0 mt-0.5" />
                            <p className="text-[11px] text-destructive leading-relaxed">{ipError}</p>
                        </div>
                    )}
                </div>

                {/* Action Groups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                        <div key={group.title} className="flex flex-col gap-2">
                            <div className={cn("flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold", group.color)}>
                                <group.icon className="size-3.5" />
                                {group.title}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                {group.actions.map((action) => {
                                    const isDisabled = action.disabled
                                    const content = (
                                        <div className={cn(
                                            "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 hover:border-primary/30 hover:bg-primary/[0.02] hover:shadow-sm transition-all group",
                                            isDisabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-card hover:shadow-none"
                                        )}>
                                            <div className={cn("flex items-center justify-center size-8 rounded-lg shrink-0", action.iconBg)}>
                                                <action.icon className={cn("size-4", action.iconColor)} />
                                            </div>
                                            <div className="flex flex-col gap-0 min-w-0 flex-1">
                                                <span className="text-xs font-semibold text-foreground leading-tight">{action.label}</span>
                                                <span className="text-[10px] text-muted-foreground leading-tight">
                                                    {isDisabled && action.disabledReason ? action.disabledReason : action.description}
                                                </span>
                                            </div>
                                            {!isDisabled && (
                                                <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                                            )}
                                        </div>
                                    )

                                    if (isDisabled) {
                                        return <div key={action.label}>{content}</div>
                                    }
                                    if (action.href) {
                                        return <Link key={action.label} href={action.href}>{content}</Link>
                                    }
                                    if (action.onClick) {
                                        return <button key={action.label} onClick={action.onClick} className="w-full text-left">{content}</button>
                                    }
                                    return <div key={action.label}>{content}</div>
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

// ─── Clinical Timeline ────────────────────────────────────────────────────────
interface TimelineEvent {
    id: string
    date: string
    type: "admission" | "lab" | "prescription" | "vaccine" | "discharge"
    title: string
    subtitle: string
    status?: string
    icon: React.ElementType
    iconBg: string
    iconColor: string
}

function ClinicalTimeline({
    admissions,
    labOrders,
    prescriptions,
    vaccines,
    patientId,
}: {
    admissions: any[]
    labOrders: any[]
    prescriptions: any[]
    vaccines: any[]
    patientId: string
}) {
    const events: TimelineEvent[] = useMemo(() => {
        const list: TimelineEvent[] = []

        if (Array.isArray(admissions)) {
            admissions.forEach((a) => {
                list.push({
                    id: `adm-${a.id}`,
                    date: a.admissionDate,
                    type: a.status === "DISCHARGED" ? "discharge" : "admission",
                    title: a.status === "DISCHARGED" ? `Discharged` : `Admitted`,
                    subtitle: `${a.admissionNumber} · ${a.department}${a.currentBed ? ` · ${a.currentBed.ward.name}` : ""}`,
                    status: a.status,
                    icon: a.status === "DISCHARGED" ? LogOut : BedDouble,
                    iconBg: a.status === "ADMITTED" ? "bg-green-100" : a.status === "DISCHARGED" ? "bg-purple-100" : "bg-blue-100",
                    iconColor: a.status === "ADMITTED" ? "text-green-700" : a.status === "DISCHARGED" ? "text-purple-700" : "text-blue-700",
                })
            })
        }

        if (Array.isArray(labOrders)) {
            labOrders.forEach((o) => {
                list.push({
                    id: `lab-${o.id}`,
                    date: o.orderDate,
                    type: "lab",
                    title: `Lab Order`,
                    subtitle: `${o.orderNumber} · ${o.status}`,
                    status: o.status,
                    icon: TestTube2,
                    iconBg: "bg-orange-100",
                    iconColor: "text-orange-700",
                })
            })
        }

        if (Array.isArray(prescriptions)) {
            prescriptions.forEach((rx) => {
                list.push({
                    id: `rx-${rx.id}`,
                    date: rx.orderedAt,
                    type: "prescription",
                    title: `Prescription`,
                    subtitle: `${rx.prescriptionNumber} · ${rx.items?.length ?? 0} item(s)${rx.doctor?.name ? ` · Dr. ${rx.doctor.name}` : ""}`,
                    status: rx.status,
                    icon: FileText,
                    iconBg: "bg-primary/10",
                    iconColor: "text-primary",
                })
            })
        }

        if (Array.isArray(vaccines)) {
            vaccines.filter((v) => v.status === "COMPLETED").forEach((v) => {
                list.push({
                    id: `vax-${v.id}`,
                    date: v.administeredAt ?? v.ageLabel,
                    type: "vaccine",
                    title: `Vaccination`,
                    subtitle: `${v.vaccineName} · ${v.ageLabel}`,
                    status: v.status,
                    icon: Syringe,
                    iconBg: "bg-[#e8f4fd]",
                    iconColor: "text-[#1a6fb5]",
                })
            })
        }

        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }, [admissions, labOrders, prescriptions, vaccines])

    const statusIcon = (status?: string) => {
        if (!status) return null
        if (["COMPLETED", "ADMITTED", "FINALIZED", "DISPENSED"].includes(status)) return <CheckCircle2 className="size-3 text-emerald-500" />
        if (["DISCHARGED"].includes(status)) return <XCircle className="size-3 text-purple-500" />
        return <Clock className="size-3 text-amber-500" />
    }

    const totalCount = admissions.length + labOrders.length + prescriptions.length + vaccines.filter(v => v.status === "COMPLETED").length

    return (
        <Card className="py-0">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <BookOpen className="size-4 text-primary" />
                        Clinical Timeline
                        {totalCount > 0 && (
                            <Badge variant="secondary" className="text-[10px] font-medium">{totalCount} events</Badge>
                        )}
                    </CardTitle>
                </div>
            </CardHeader>
            <CardContent className="px-5 py-4">
                {events.length === 0 ? (
                    <ActionableEmpty
                        icon={BookOpen}
                        message="No clinical events recorded yet."
                        actionLabel="Generate OP Visit"
                        actionHref={`/patients/${patientId}/prescription`}
                    />
                ) : (
                    <div className="relative flex flex-col gap-0">
                        {/* Timeline line */}
                        <div className="absolute left-[18px] top-4 bottom-4 w-px bg-border" />

                        {events.slice(0, 10).map((event, idx) => (
                            <div key={event.id} className="flex items-start gap-3 py-3 relative border-b last:border-0">
                                <div className={cn("flex items-center justify-center size-9 rounded-full shrink-0 z-10 border-2 border-background shadow-sm", event.iconBg)}>
                                    <event.icon className={cn("size-4", event.iconColor)} />
                                </div>
                                <div className="flex flex-col gap-0.5 flex-1 min-w-0 pt-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold text-foreground">{event.title}</span>
                                        {statusIcon(event.status)}
                                        <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                                            {isNaN(new Date(event.date).getTime()) ? event.date : formatDate(event.date)}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed truncate">{event.subtitle}</p>
                                </div>
                            </div>
                        ))}

                        {events.length > 10 && (
                            <p className="text-xs text-muted-foreground text-center pt-3">
                                + {events.length - 10} older events
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function PatientDetailContent({ patientId }: { patientId: string }) {
    const router = useRouter()
    const { data: patient, isLoading, error } = useQuery<ApiPatient>(`/patients/${patientId}`)
    const { admissions: admissionHistory, isLoading: admLoading } = usePatientAdmissions(patient?.id ?? null)
    const { orders: labOrders } = usePatientLabOrders(patient?.id ?? null)
    const { schedule: vaccineSchedule } = usePatientVaccinations(patient?.id ?? null)
    const { prescriptions } = usePrescriptions({ patientId: patient?.id ?? undefined })

    const [opLoading, setOpLoading] = useState(false)
    const [opError, setOpError] = useState<string | null>(null)
    const [ipLoading, setIpLoading] = useState(false)
    const [ipError, setIpError] = useState<string | null>(null)

    const activeAdmission = admissionHistory.find(
        (a) => a.status === "ADMITTED" || a.status === "BED_ASSIGNED"
    ) ?? null

    async function handleGenerateOP() {
        if (!patient) return
        setOpLoading(true)
        setOpError(null)
        try {
            const opVisit = await createOPVisit({ patientId: patient.id, department: "General OPD" })
            const bill = await createBill({ patientId: patient.id, opVisitId: opVisit.id })
            router.push(`/billing/op/new?billId=${bill.id}`)
        } catch (err: any) {
            setOpError(err?.message ?? "Failed to generate OP")
        } finally {
            setOpLoading(false)
        }
    }

    async function handleGenerateIPBill() {
        if (!patient || !activeAdmission) return
        setIpLoading(true)
        setIpError(null)
        try {
            const bill = await createBill({ patientId: patient.id, admissionId: activeAdmission.id })
            router.push(`/billing/ip?billId=${bill.id}`)
        } catch (err: any) {
            setIpError(err?.message ?? "Failed to generate IP bill")
        } finally {
            setIpLoading(false)
        }
    }

    if (isLoading) return <DetailSkeleton />

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
    const ageMonths = calcAgeInMonths(patient.dateOfBirth)
    const dob = formatDob(patient.dateOfBirth)
    const genderLabel = patient.gender === "MALE" ? "Male" : patient.gender === "FEMALE" ? "Female" : "Other"
    const isNeonatal = age.includes("day") || age.includes("month")
    const bw = patient.birthWeight ? parseFloat(patient.birthWeight) : null

    const isNICUAdmitted = admissionHistory.some(
        (a) => (a.status === "ADMITTED" || a.status === "BED_ASSIGNED") && a.department?.toUpperCase().includes("NICU")
    )

    const overdueVaccines = vaccineSchedule.filter((v: any) => v.status === "MISSED" || v.status === "DUE")

    // Patient status label
    const patientStatusLabel = activeAdmission
        ? { label: `Admitted · ${activeAdmission.department}${activeAdmission.currentBed ? ` · ${activeAdmission.currentBed.ward.name}` : ""}`, color: "bg-blue-100 text-blue-700 border-blue-200" }
        : { label: "OP Active", color: "bg-emerald-100 text-emerald-700 border-emerald-200" }

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

                {/* ── Patient Header Card ────────────────────────────────────────────── */}
                <Card className="py-0">
                    <CardContent className="px-5 py-5">
                        <div className="flex flex-col gap-4">
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
                                            {/* Patient Status */}
                                            <div className={cn("flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold", patientStatusLabel.color)}>
                                                {activeAdmission ? <BedDouble className="size-3" /> : <Activity className="size-3" />}
                                                {patientStatusLabel.label}
                                            </div>
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
                                                <span className="flex items-center gap-1 font-semibold text-foreground">🩸 {patient.bloodGroup}</span>
                                            )}
                                            {bw !== null && (
                                                <span className={cn("flex items-center gap-1 font-semibold", bw < 2.5 ? "text-red-600" : "text-foreground")}>
                                                    ⚖️ {bw} kg birth wt.{bw < 2.5 ? " ⚠️" : ""}
                                                </span>
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

                                {/* Reg info */}
                                <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-muted/20 px-3 py-2 shrink-0 text-right">
                                    <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Registered</span>
                                    <span className="text-sm font-bold text-foreground">{formatDob(patient.createdAt)}</span>
                                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                                        <ClipboardList className="size-3" /> {admissionHistory.length} admission{admissionHistory.length !== 1 ? "s" : ""}
                                    </span>
                                </div>
                            </div>

                            {/* Clinical Alert Banner */}
                            <ClinicalAlertBanner
                                patient={patient}
                                ageMonths={ageMonths}
                                overdueVaccines={overdueVaccines}
                                isNICUAdmitted={isNICUAdmitted}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* ── Smart Suggestions ──────────────────────────────────────────────── */}
                <SmartSuggestionsPanel
                    patient={patient}
                    ageMonths={ageMonths}
                    activeAdmission={activeAdmission}
                    overdueVaccines={overdueVaccines}
                    prescriptions={prescriptions}
                    onGenerateOP={handleGenerateOP}
                    patientId={patientId}
                />

                {/* ── Vitals Dashboard ── */}
                <VitalsCard patientId={patientId} />

                {/* ── Workflow Action Hub ─────────────────────────────────────────────── */}
                {patient.status === "ACTIVE" && (
                    <WorkflowActionHub
                        patient={patient}
                        patientId={patientId}
                        fullName={fullName}
                        isNeonatal={isNeonatal}
                        activeAdmission={activeAdmission}
                        opLoading={opLoading}
                        ipLoading={ipLoading}
                        opError={opError}
                        ipError={ipError}
                        onGenerateOP={handleGenerateOP}
                        onGenerateIPBill={handleGenerateIPBill}
                    />
                )}

                {/* ── Admission History (compact, part of main page) ──────────────────── */}
                {admLoading ? (
                    <Card className="py-0">
                        <CardContent className="px-5 py-5">
                            <div className="space-y-3">
                                {[0, 1].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        </CardContent>
                    </Card>
                ) : admissionHistory.length > 0 && (
                    <Card className="py-0">
                        <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <BedDouble className="size-4 text-primary" />
                                Active Admission
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 py-4">
                            {activeAdmission ? (
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-green-100 text-green-700">
                                            <BedDouble className="size-4" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{activeAdmission.admissionNumber}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {activeAdmission.department} · {new Date(activeAdmission.admissionDate).toLocaleDateString("en-IN")}
                                                {activeAdmission.currentBed && ` · ${activeAdmission.currentBed.ward.name} / Bed ${activeAdmission.currentBed.bedNumber}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge className="text-xs bg-green-50 text-green-700 border-green-200">{activeAdmission.status}</Badge>
                                        <Link href={`/admissions/${activeAdmission.id}/transfer`}>
                                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1">
                                                <ArrowRightLeft className="size-3" /> Transfer
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <ActionableEmpty
                                    icon={BedDouble}
                                    message="No active admission."
                                    actionLabel="Admit Patient"
                                    actionHref={`/admissions/new?patientId=${patient.id}`}
                                />
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ── Clinical Timeline ───────────────────────────────────────────────── */}
                <ClinicalTimeline
                    admissions={admissionHistory}
                    labOrders={labOrders}
                    prescriptions={prescriptions}
                    vaccines={vaccineSchedule}
                    patientId={patientId}
                />
            </div>
        </>
    )
}
