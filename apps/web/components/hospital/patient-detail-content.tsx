"use client"

import React from "react"
import Link from "next/link"
import {
    AlertTriangle,
    Baby,
    BedDouble,
    BookOpen,
    CalendarDays,
    Clock,
    ClipboardList,
    CreditCard,
    FileText,
    FlaskConical,
    Mail,
    MapPin,
    Phone,
    Stethoscope,
    Syringe,
    TrendingUp,
    User2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { usePatientHub } from "@/hooks/use-patient-hub"
import {
    type PatientHubClinicalItem,
    type PatientHubGrowth,
    type PatientHubIconKey,
    type PatientHubInsightItem,
    type PatientHubTimelineItem,
    type PatientHubTone,
} from "@/lib/adapters/patient-hub"

const iconMap: Record<PatientHubIconKey, React.ElementType> = {
    alert: AlertTriangle,
    growth: TrendingUp,
    visit: Stethoscope,
    admission: BedDouble,
    prescription: FileText,
    consultation: FileText,
    vaccine: Syringe,
    lab: FlaskConical,
    service: ClipboardList,
}

function getSurfaceClasses(tone: PatientHubTone) {
    switch (tone) {
        case "danger":
            return "border-red-200 bg-red-50 text-red-800"
        case "warning":
            return "border-amber-200 bg-amber-50 text-amber-800"
        case "success":
            return "border-emerald-200 bg-emerald-50 text-emerald-800"
        case "info":
            return "border-sky-200 bg-sky-50 text-sky-800"
        default:
            return "border-slate-200 bg-slate-50 text-slate-800"
    }
}

function getAccentClasses(tone: PatientHubTone) {
    switch (tone) {
        case "danger":
            return { accent: "bg-red-50", icon: "text-red-700" }
        case "warning":
            return { accent: "bg-amber-50", icon: "text-amber-700" }
        case "success":
            return { accent: "bg-emerald-50", icon: "text-emerald-700" }
        case "info":
            return { accent: "bg-sky-50", icon: "text-sky-700" }
        default:
            return { accent: "bg-slate-50", icon: "text-slate-700" }
    }
}

function getStatusBadgeClasses(status: "active" | "inactive") {
    return status === "active"
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-muted text-muted-foreground border-border"
}

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
            <Card className="py-0">
                <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                    <Skeleton className="h-4 w-36" />
                </CardHeader>
                <CardContent className="px-5 py-4">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-16 rounded-xl" />
                        ))}
                    </div>
                </CardContent>
            </Card>
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="py-0 h-full">
                    <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                        <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent className="px-5 py-4 flex flex-col gap-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} className="h-20 rounded-xl" />
                        ))}
                    </CardContent>
                </Card>
                <Card className="py-0 h-full">
                    <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                        <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent className="px-5 py-4">
                        <div className="grid gap-3 md:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <Skeleton key={index} className="h-24 rounded-xl" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Card className="py-0">
                <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                    <Skeleton className="h-4 w-40" />
                </CardHeader>
                <CardContent className="px-5 py-4 flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 rounded-xl" />
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}

function SectionErrorState({
    title,
    message,
    onRetry,
}: {
    title: string
    message: string
    onRetry: () => void
}) {
    return (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
                <p className="text-sm font-semibold text-red-800">{title}</p>
                <p className="text-xs text-red-700">{message}</p>
            </div>
            <Button variant="outline" size="sm" className="w-fit" onClick={onRetry}>
                Retry
            </Button>
        </div>
    )
}

function EmptySectionState({
    icon: Icon,
    title,
    message,
}: {
    icon: React.ElementType
    title: string
    message: string
}) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="size-5" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{title}</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">{message}</p>
        </div>
    )
}

function HeaderCardSkeleton() {
    return (
        <Card className="py-0">
            <CardContent className="px-5 py-5">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                        <Skeleton className="size-14 rounded-full shrink-0" />
                        <div className="min-w-0 flex flex-1 flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                            <Skeleton className="h-4 w-72" />
                            <Skeleton className="h-4 w-80" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <div className="w-full max-w-sm shrink-0 rounded-2xl border border-border bg-muted/20 p-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                        <Skeleton className="mt-4 h-16 w-full" />
                        <Skeleton className="mt-4 h-10 w-full" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function ClinicalSummarySkeleton() {
    return (
        <Card className="py-0">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="size-4 text-amber-600" />
                    Clinical Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 rounded-xl" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function SmartInsightsSkeleton() {
    return (
        <Card className="py-0 h-full">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <BookOpen className="size-4 text-slate-600" />
                    Smart Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 rounded-xl" />
                ))}
            </CardContent>
        </Card>
    )
}

function GrowthSnapshotSkeleton() {
    return (
        <Card className="py-0 h-full">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="size-4 text-emerald-600" />
                    Growth Snapshot
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
                <div className="grid gap-3 md:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-24 rounded-xl" />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function TimelineSkeleton() {
    return (
        <Card className="py-0">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="size-4 text-slate-600" />
                    Recent Clinical Timeline
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-16 rounded-xl" />
                ))}
            </CardContent>
        </Card>
    )
}

function PatientClinicalSummary({
    items,
    isLoading,
    error,
    onRetry,
}: {
    items: PatientHubClinicalItem[]
    isLoading: boolean
    error?: Error
    onRetry: () => void
}) {
    if (isLoading) return <ClinicalSummarySkeleton />

    return (
        <Card className="py-0">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <AlertTriangle className="size-4 text-amber-600" />
                    Clinical Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
                {error ? (
                    <SectionErrorState
                        title="Clinical summary unavailable"
                        message="Some supporting patient signals could not be loaded."
                        onRetry={onRetry}
                    />
                ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No priority clinical flags detected.</p>
                ) : (
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {items.map((item) => (
                            <div
                                key={item.key}
                                className={cn(
                                    "rounded-xl border px-3 py-3 text-sm font-medium",
                                    getSurfaceClasses(item.tone),
                                )}
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function PatientSmartInsights({
    items,
    isLoading,
    error,
    onRetry,
}: {
    items: PatientHubInsightItem[]
    isLoading: boolean
    error?: Error
    onRetry: () => void
}) {
    if (isLoading) return <SmartInsightsSkeleton />

    return (
        <Card className="py-0 h-full">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <BookOpen className="size-4 text-slate-600" />
                    Smart Insights
                    <Badge variant="secondary" className="text-[10px] font-medium">
                        {items.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
                {error ? (
                    <SectionErrorState
                        title="Insights unavailable"
                        message="Additional clinical context could not be loaded right now."
                        onRetry={onRetry}
                    />
                ) : items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No additional context surfaced for this visit.</p>
                ) : (
                    <div className="flex flex-col gap-3">
                        {items.map((item) => {
                            const Icon = iconMap[item.iconKey]
                            const accentClasses = getAccentClasses(item.tone)

                            return (
                            <div key={item.key} className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-3">
                                <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", accentClasses.accent)}>
                                    <Icon className={cn("size-4", accentClasses.icon)} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.detail}</p>
                                </div>
                            </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function GrowthMetricTile({
    label,
    value,
    hint,
}: {
    label: string
    value: string
    hint?: React.ReactNode
}) {
    return (
        <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
            {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
        </div>
    )
}

function PatientGrowthSnapshot({
    growth,
    isLoading,
    error,
    onRetry,
}: {
    growth: PatientHubGrowth
    isLoading: boolean
    error?: Error
    onRetry: () => void
}) {
    if (isLoading) return <GrowthSnapshotSkeleton />

    return (
        <Card className="py-0 h-full">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="size-4 text-emerald-600" />
                    Growth Snapshot
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
                {error ? (
                    <SectionErrorState
                        title="Growth snapshot unavailable"
                        message="Recent growth measurements could not be loaded."
                        onRetry={onRetry}
                    />
                ) : !growth.hasData ? (
                    <EmptySectionState
                        icon={TrendingUp}
                        title="No growth data yet"
                        message="Weight, height, and head circumference will appear here once the first measurement is recorded."
                    />
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                            <span>Latest recorded: {growth.recordedAtLabel}</span>
                            <span>Age at record: {growth.ageAtRecordLabel}</span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                            {growth.metrics.map((metric) => (
                                <GrowthMetricTile
                                    key={metric.key}
                                    label={metric.label}
                                    value={metric.value}
                                    hint={metric.hint ? <span className={getAccentClasses(growth.percentileTone).icon}>{metric.hint}</span> : undefined}
                                />
                            ))}
                        </div>
                        {growth.percentileDetail ? (
                            <p className="text-xs text-muted-foreground">{growth.percentileDetail}</p>
                        ) : null}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function PatientRecentTimeline({
    items,
    isLoading,
    error,
    onRetry,
}: {
    items: PatientHubTimelineItem[]
    isLoading: boolean
    error?: Error
    onRetry: () => void
}) {
    if (isLoading) return <TimelineSkeleton />

    return (
        <Card className="py-0">
            <CardHeader className="px-5 pt-4 pb-3 border-b border-border">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Clock className="size-4 text-slate-600" />
                    Recent Clinical Timeline
                </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
                {error ? (
                    <SectionErrorState
                        title="Timeline unavailable"
                        message="Recent clinical events could not be loaded."
                        onRetry={onRetry}
                    />
                ) : items.length === 0 ? (
                    <EmptySectionState
                        icon={Clock}
                        title="No recent events"
                        message="Clinical activity from visits, consultations, prescriptions, admissions, and vaccinations will appear here when available."
                    />
                ) : (
                    <div className="relative flex flex-col">
                        <div className="absolute left-[17px] top-3 bottom-3 w-px bg-border" />
                        {items.map((item) => {
                            const Icon = iconMap[item.iconKey]
                            const accentClasses = getAccentClasses(item.tone)

                            return (
                            <div key={item.id} className="relative flex items-start gap-3 py-3 border-b last:border-b-0">
                                <div className={cn("relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-background bg-muted", accentClasses.icon)}>
                                    <Icon className="size-4" />
                                </div>
                                <div className="min-w-0 flex-1 pt-0.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-foreground">{item.title}</span>
                                        {item.badge ? (
                                            <Badge variant="outline" className="text-[10px] font-medium">
                                                {item.badge}
                                            </Badge>
                                        ) : null}
                                        <span className="ml-auto text-[11px] text-muted-foreground">{item.occurredAtLabel}</span>
                                    </div>
                                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.subtitle}</p>
                                </div>
                            </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function PatientDetailContent({ patientId }: { patientId: string }) {
    const { patientHub, isLoading, error, isMissing, retry, sections } = usePatientHub(patientId)

    if (isLoading) return <DetailSkeleton />

    if (error || isMissing) {
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
                    {error ? (
                        <Button variant="outline" size="sm" onClick={() => void retry()}>
                            Retry
                        </Button>
                    ) : null}
                    <Link href="/patients" className="text-sm text-primary hover:underline">Back to Patient List</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1100px] mx-auto">
            <div className="flex items-center gap-2 text-sm">
                <Link href="/patients" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                    ← Patients
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-foreground font-medium">{patientHub.header.fullName}</span>
            </div>

            {sections.header.isLoading ? (
                <HeaderCardSkeleton />
            ) : (
                <Card className="py-0">
                    <CardContent className="px-5 py-5">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4 min-w-0">
                                <div className={cn(
                                    "flex items-center justify-center size-14 rounded-full shrink-0",
                                    patientHub.header.avatarTone === "female"
                                        ? "bg-rose-50"
                                        : patientHub.header.avatarTone === "newborn"
                                            ? "bg-red-50"
                                            : "bg-sky-50",
                                )}>
                                    <Baby className={cn(
                                        "size-7",
                                        patientHub.header.avatarTone === "female"
                                            ? "text-rose-600"
                                            : patientHub.header.avatarTone === "newborn"
                                                ? "text-red-600"
                                                : "text-sky-700",
                                    )} />
                                </div>

                                <div className="min-w-0 flex flex-col gap-2">
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <h1 className="text-lg font-bold tracking-tight text-foreground">{patientHub.header.fullName}</h1>
                                        <Badge variant="secondary" className="text-[11px] font-mono">{patientHub.header.uhid}</Badge>
                                        <Badge variant="outline" className={cn("text-[11px] font-semibold", getStatusBadgeClasses(patientHub.header.patientStatus))}>
                                            {patientHub.header.patientStatusLabel}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><CalendarDays className="size-3" />DOB: {patientHub.header.dobLabel}</span>
                                        <span className="flex items-center gap-1"><User2 className="size-3" />{patientHub.header.ageLabel} · {patientHub.header.genderLabel}</span>
                                        {patientHub.header.bloodGroup ? <span className="font-medium text-foreground">Blood Group: {patientHub.header.bloodGroup}</span> : null}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        <span>Guardian: {patientHub.header.guardianLabel}</span>
                                        {patientHub.header.phone ? <span className="flex items-center gap-1"><Phone className="size-3" />{patientHub.header.phone}</span> : null}
                                        {patientHub.header.guardianPhone ? <span className="flex items-center gap-1"><Phone className="size-3" />{patientHub.header.guardianPhone}</span> : null}
                                        {patientHub.header.email ? <span className="flex items-center gap-1"><Mail className="size-3" />{patientHub.header.email}</span> : null}
                                    </div>

                                    {patientHub.header.addressLine ? (
                                        <p className="flex items-start gap-1 text-xs text-muted-foreground">
                                            <MapPin className="size-3 shrink-0 mt-0.5" />
                                            {patientHub.header.addressLine}
                                        </p>
                                    ) : null}

                                    {patientHub.header.abhaId ? (
                                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <CreditCard className="size-3" />ABHA: <span className="font-mono text-foreground">{patientHub.header.abhaId}</span>
                                        </p>
                                    ) : null}
                                </div>
                            </div>

                            <div className="w-full max-w-sm shrink-0 rounded-2xl border border-border bg-muted/20 p-4">
                                {sections.header.error ? (
                                    <SectionErrorState
                                        title="Header context incomplete"
                                        message="Admission or visit details could not be loaded."
                                        onRetry={() => void sections.header.retry()}
                                    />
                                ) : null}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Registered</p>
                                            <p className="mt-1 text-sm font-semibold text-foreground">{patientHub.header.registeredLabel}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Admissions</p>
                                            <p className="mt-1 text-sm font-semibold text-foreground">{patientHub.header.admissionsCount}</p>
                                    </div>
                                </div>

                                {patientHub.header.activeAdmission ? (
                                    <div className={cn("mt-4 rounded-xl border px-3 py-3", getSurfaceClasses(patientHub.header.activeAdmission.tone))}>
                                        <p className="text-[10px] uppercase tracking-wide">{patientHub.header.activeAdmission.label}</p>
                                        <p className="mt-1 text-sm font-semibold">{patientHub.header.activeAdmission.title}</p>
                                        <p className="text-xs opacity-80">{patientHub.header.activeAdmission.detail}</p>
                                    </div>
                                ) : null}

                                {patientHub.header.activeVisit ? (
                                    <div className={cn("mt-4 rounded-xl border px-3 py-3", getSurfaceClasses(patientHub.header.activeVisit.tone))}>
                                        <p className="text-[10px] uppercase tracking-wide">{patientHub.header.activeVisit.label}</p>
                                        <p className="mt-1 text-sm font-semibold">{patientHub.header.activeVisit.title}</p>
                                        <p className="text-xs opacity-80">{patientHub.header.activeVisit.detail}</p>
                                    </div>
                                ) : null}

                                {sections.cta.isLoading || patientHub.cta.disabled ? (
                                    <Button className="mt-4 w-full gap-2" disabled>
                                        <Stethoscope className="size-4" />
                                        {sections.cta.isLoading ? "Checking encounter…" : patientHub.cta.label}
                                    </Button>
                                ) : (
                                    <Button className="mt-4 w-full gap-2" asChild>
                                        <Link href={patientHub.cta.href}>
                                            <Stethoscope className="size-4" />
                                            {patientHub.cta.label}
                                        </Link>
                                    </Button>
                                )}
                                {sections.cta.error ? (
                                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                                        <p className="text-xs text-red-700">Consultation state is incomplete.</p>
                                        <Button variant="outline" size="sm" onClick={() => void sections.cta.retry()}>
                                            Retry
                                        </Button>
                                    </div>
                                ) : patientHub.cta.supportingText ? (
                                    <p className="mt-2 text-xs text-muted-foreground">{patientHub.cta.supportingText}</p>
                                ) : null}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <PatientClinicalSummary
                items={patientHub.clinicalSummary}
                isLoading={sections.clinicalSummary.isLoading}
                error={sections.clinicalSummary.error}
                onRetry={() => void sections.clinicalSummary.retry()}
            />

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <PatientSmartInsights
                    items={patientHub.insights}
                    isLoading={sections.insights.isLoading}
                    error={sections.insights.error}
                    onRetry={() => void sections.insights.retry()}
                />
                <PatientGrowthSnapshot
                    growth={patientHub.growth}
                    isLoading={sections.growth.isLoading}
                    error={sections.growth.error}
                    onRetry={() => void sections.growth.retry()}
                />
            </div>

            <PatientRecentTimeline
                items={patientHub.timeline}
                isLoading={sections.timeline.isLoading}
                error={sections.timeline.error}
                onRetry={() => void sections.timeline.retry()}
            />
        </div>
    )
}
