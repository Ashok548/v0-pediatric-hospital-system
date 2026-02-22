"use client"

import { useState } from "react"
import {
  Syringe,
  CalendarDays,
  User2,
  Stethoscope,
  AlertTriangle,
  Check,
  Download,
  Clock,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  CircleCheck,
  CircleDashed,
  CircleX,
  Baby,
  ChevronDown,
  ChevronUp,
  Printer,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// ─── Patient ────────────────────────────────────────────────
const child = {
  id: "PED-20250318",
  name: "Arya Sharma",
  dob: "Mar 18, 2025",
  age: "11 months",
  gender: "Female",
  bloodGroup: "B+",
  weight: "7.2 kg",
  guardian: "Meera Sharma (Mother)",
  phone: "+91 98765 43210",
  doctor: "Dr. Priya Reddy",
}

// ─── Vaccine schedule (IAP 2024-aligned) ────────────────────
type VaccineStatus = "completed" | "upcoming" | "missed" | "due-today"

interface Vaccine {
  id: string
  name: string
  dose: string
  ageLabel: string
  scheduledDate: string
  administeredDate?: string
  status: VaccineStatus
  site?: string
  batch?: string
  notes?: string
}

interface VaccineGroup {
  ageLabel: string
  vaccines: Vaccine[]
}

const vaccineGroups: VaccineGroup[] = [
  {
    ageLabel: "At Birth",
    vaccines: [
      {
        id: "v1",
        name: "BCG",
        dose: "Dose 1",
        ageLabel: "Birth",
        scheduledDate: "Mar 18, 2025",
        administeredDate: "Mar 18, 2025",
        status: "completed",
        site: "Left upper arm (intradermal)",
        batch: "BCG-2025-0421",
      },
      {
        id: "v2",
        name: "OPV",
        dose: "Zero Dose",
        ageLabel: "Birth",
        scheduledDate: "Mar 18, 2025",
        administeredDate: "Mar 18, 2025",
        status: "completed",
        site: "Oral",
        batch: "OPV-2025-1130",
      },
      {
        id: "v3",
        name: "Hepatitis B",
        dose: "Birth Dose",
        ageLabel: "Birth",
        scheduledDate: "Mar 18, 2025",
        administeredDate: "Mar 18, 2025",
        status: "completed",
        site: "Right thigh (IM)",
        batch: "HBV-2025-0892",
      },
    ],
  },
  {
    ageLabel: "6 Weeks",
    vaccines: [
      {
        id: "v4",
        name: "Pentavalent (DTwP-HepB-Hib)",
        dose: "Dose 1",
        ageLabel: "6 weeks",
        scheduledDate: "Apr 29, 2025",
        administeredDate: "Apr 30, 2025",
        status: "completed",
        site: "Left thigh (IM)",
        batch: "PENTA-2025-3310",
      },
      {
        id: "v5",
        name: "IPV",
        dose: "Dose 1",
        ageLabel: "6 weeks",
        scheduledDate: "Apr 29, 2025",
        administeredDate: "Apr 30, 2025",
        status: "completed",
        site: "Right thigh (IM)",
        batch: "IPV-2025-0142",
      },
      {
        id: "v6",
        name: "Rotavirus",
        dose: "Dose 1",
        ageLabel: "6 weeks",
        scheduledDate: "Apr 29, 2025",
        administeredDate: "Apr 30, 2025",
        status: "completed",
        site: "Oral",
        batch: "RV-2025-2200",
      },
      {
        id: "v7",
        name: "PCV (Pneumococcal)",
        dose: "Dose 1",
        ageLabel: "6 weeks",
        scheduledDate: "Apr 29, 2025",
        administeredDate: "May 01, 2025",
        status: "completed",
        site: "Left thigh (IM)",
        batch: "PCV-2025-5540",
      },
    ],
  },
  {
    ageLabel: "10 Weeks",
    vaccines: [
      {
        id: "v8",
        name: "Pentavalent (DTwP-HepB-Hib)",
        dose: "Dose 2",
        ageLabel: "10 weeks",
        scheduledDate: "May 27, 2025",
        administeredDate: "May 28, 2025",
        status: "completed",
        site: "Right thigh (IM)",
        batch: "PENTA-2025-3311",
      },
      {
        id: "v9",
        name: "IPV",
        dose: "Dose 2",
        ageLabel: "10 weeks",
        scheduledDate: "May 27, 2025",
        administeredDate: "May 28, 2025",
        status: "completed",
        site: "Left thigh (IM)",
        batch: "IPV-2025-0143",
      },
      {
        id: "v10",
        name: "Rotavirus",
        dose: "Dose 2",
        ageLabel: "10 weeks",
        scheduledDate: "May 27, 2025",
        administeredDate: "May 28, 2025",
        status: "completed",
        site: "Oral",
        batch: "RV-2025-2201",
      },
    ],
  },
  {
    ageLabel: "14 Weeks",
    vaccines: [
      {
        id: "v11",
        name: "Pentavalent (DTwP-HepB-Hib)",
        dose: "Dose 3",
        ageLabel: "14 weeks",
        scheduledDate: "Jun 24, 2025",
        administeredDate: "Jun 25, 2025",
        status: "completed",
        site: "Right thigh (IM)",
        batch: "PENTA-2025-3312",
      },
      {
        id: "v12",
        name: "IPV",
        dose: "Dose 3",
        ageLabel: "14 weeks",
        scheduledDate: "Jun 24, 2025",
        administeredDate: "Jun 25, 2025",
        status: "completed",
        site: "Left thigh (IM)",
        batch: "IPV-2025-0144",
      },
      {
        id: "v13",
        name: "Rotavirus",
        dose: "Dose 3",
        ageLabel: "14 weeks",
        scheduledDate: "Jun 24, 2025",
        administeredDate: "Jun 25, 2025",
        status: "completed",
        site: "Oral",
        batch: "RV-2025-2202",
      },
      {
        id: "v14",
        name: "PCV (Pneumococcal)",
        dose: "Dose 2",
        ageLabel: "14 weeks",
        scheduledDate: "Jun 24, 2025",
        administeredDate: "Jun 25, 2025",
        status: "completed",
        site: "Left thigh (IM)",
        batch: "PCV-2025-5541",
      },
    ],
  },
  {
    ageLabel: "6 Months",
    vaccines: [
      {
        id: "v15",
        name: "OPV",
        dose: "Dose 1",
        ageLabel: "6 months",
        scheduledDate: "Sep 18, 2025",
        status: "missed",
        notes: "Family travel - not administered. Catch-up needed.",
      },
      {
        id: "v16",
        name: "Hepatitis B",
        dose: "Dose 2",
        ageLabel: "6 months",
        scheduledDate: "Sep 18, 2025",
        status: "missed",
        notes: "Missed along with OPV. Catch-up scheduled.",
      },
    ],
  },
  {
    ageLabel: "9 Months",
    vaccines: [
      {
        id: "v17",
        name: "MR (Measles-Rubella)",
        dose: "Dose 1",
        ageLabel: "9 months",
        scheduledDate: "Dec 18, 2025",
        administeredDate: "Dec 19, 2025",
        status: "completed",
        site: "Right upper arm (SC)",
        batch: "MR-2025-7890",
      },
      {
        id: "v18",
        name: "PCV (Pneumococcal)",
        dose: "Booster",
        ageLabel: "9 months",
        scheduledDate: "Dec 18, 2025",
        administeredDate: "Dec 19, 2025",
        status: "completed",
        site: "Left thigh (IM)",
        batch: "PCV-2025-5542",
      },
      {
        id: "v19",
        name: "OPV",
        dose: "Dose 1 (Catch-up)",
        ageLabel: "9 months",
        scheduledDate: "Dec 18, 2025",
        administeredDate: "Dec 19, 2025",
        status: "completed",
        site: "Oral",
        batch: "OPV-2025-1131",
        notes: "Catch-up dose for missed 6-month dose.",
      },
    ],
  },
  {
    ageLabel: "12 Months (Due Today)",
    vaccines: [
      {
        id: "v20",
        name: "Hepatitis A",
        dose: "Dose 1",
        ageLabel: "12 months",
        scheduledDate: "Feb 22, 2026",
        status: "due-today",
      },
      {
        id: "v21",
        name: "Hepatitis B",
        dose: "Dose 2 (Catch-up)",
        ageLabel: "12 months",
        scheduledDate: "Feb 22, 2026",
        status: "due-today",
        notes: "Catch-up dose for missed 6-month HepB.",
      },
    ],
  },
  {
    ageLabel: "15 Months",
    vaccines: [
      {
        id: "v22",
        name: "MMR",
        dose: "Dose 1",
        ageLabel: "15 months",
        scheduledDate: "Jun 18, 2026",
        status: "upcoming",
      },
      {
        id: "v23",
        name: "Varicella",
        dose: "Dose 1",
        ageLabel: "15 months",
        scheduledDate: "Jun 18, 2026",
        status: "upcoming",
      },
    ],
  },
  {
    ageLabel: "16-18 Months",
    vaccines: [
      {
        id: "v24",
        name: "DPT Booster",
        dose: "Booster 1",
        ageLabel: "16-18 months",
        scheduledDate: "Aug 18, 2026",
        status: "upcoming",
      },
      {
        id: "v25",
        name: "IPV Booster",
        dose: "Booster",
        ageLabel: "16-18 months",
        scheduledDate: "Aug 18, 2026",
        status: "upcoming",
      },
      {
        id: "v26",
        name: "Hib Booster",
        dose: "Booster",
        ageLabel: "16-18 months",
        scheduledDate: "Aug 18, 2026",
        status: "upcoming",
      },
    ],
  },
]

const allVaccines = vaccineGroups.flatMap((g) => g.vaccines)
const completedCount = allVaccines.filter((v) => v.status === "completed").length
const missedCount = allVaccines.filter((v) => v.status === "missed").length
const dueTodayCount = allVaccines.filter((v) => v.status === "due-today").length
const upcomingCount = allVaccines.filter((v) => v.status === "upcoming").length

// ─── Status helpers ─────────────────────────────────────────
const statusConfig: Record<
  VaccineStatus,
  { label: string; dotClass: string; bgClass: string; textClass: string; icon: React.ElementType }
> = {
  completed: {
    label: "Completed",
    dotClass: "bg-[#22a06b]",
    bgClass: "bg-[#22a06b]/8",
    textClass: "text-[#1a7f5a]",
    icon: CircleCheck,
  },
  "due-today": {
    label: "Due Today",
    dotClass: "bg-primary",
    bgClass: "bg-primary/8",
    textClass: "text-primary",
    icon: Clock,
  },
  missed: {
    label: "Missed",
    dotClass: "bg-destructive",
    bgClass: "bg-destructive/8",
    textClass: "text-destructive",
    icon: CircleX,
  },
  upcoming: {
    label: "Upcoming",
    dotClass: "bg-muted-foreground",
    bgClass: "bg-muted-foreground/8",
    textClass: "text-muted-foreground",
    icon: CircleDashed,
  },
}

// ─── Component ──────────────────────────────────────────────
export function VaccinationContent() {
  const [completedVaccines, setCompletedVaccines] = useState<Set<string>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(vaccineGroups.filter((g) => g.vaccines.some((v) => v.status === "due-today" || v.status === "missed")).map((g) => g.ageLabel))
  )

  function toggleGroup(ageLabel: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(ageLabel)) next.delete(ageLabel)
      else next.add(ageLabel)
      return next
    })
  }

  function markComplete(vaccineId: string) {
    setCompletedVaccines((prev) => new Set(prev).add(vaccineId))
  }

  function getEffectiveStatus(vaccine: Vaccine): VaccineStatus {
    if (completedVaccines.has(vaccine.id)) return "completed"
    return vaccine.status
  }

  // Timeline line color based on group status
  function groupLineColor(group: VaccineGroup) {
    const statuses = group.vaccines.map(getEffectiveStatus)
    if (statuses.every((s) => s === "completed")) return "bg-[#22a06b]"
    if (statuses.some((s) => s === "missed")) return "bg-destructive"
    if (statuses.some((s) => s === "due-today")) return "bg-primary"
    return "bg-border"
  }

  function groupDotColor(group: VaccineGroup) {
    const statuses = group.vaccines.map(getEffectiveStatus)
    if (statuses.every((s) => s === "completed")) return "border-[#22a06b] bg-[#22a06b]"
    if (statuses.some((s) => s === "missed")) return "border-destructive bg-destructive"
    if (statuses.some((s) => s === "due-today")) return "border-primary bg-primary"
    return "border-border bg-card"
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/patients"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Patients
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">Vaccination Record</span>
      </div>

      {/* ─── Child Details Header ─────────────────────────── */}
      <Card className="gap-0 py-0">
        <CardContent className="px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-14 rounded-full bg-[#22a06b]/10 shrink-0">
                <Baby className="size-7 text-[#22a06b]" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg font-bold text-foreground tracking-tight">
                    {child.name}
                  </h1>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {child.id}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    DOB: {child.dob}
                  </span>
                  <span className="flex items-center gap-1">
                    <User2 className="size-3" />
                    {child.age} &middot; {child.gender}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="size-3" />
                    {child.doctor}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span>Guardian: {child.guardian}</span>
                  <span>Blood Group: {child.bloodGroup}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Printer className="size-3.5" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button size="sm" className="gap-1.5 text-xs bg-[#22a06b] hover:bg-[#1a7f5a] text-[#ffffff]">
                <Download className="size-3.5" />
                Download Certificate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Summary Stats ────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="py-4 gap-0">
          <CardContent className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-[#22a06b]/10 shrink-0">
              <ShieldCheck className="size-5 text-[#22a06b]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground tabular-nums leading-tight">
                {completedCount + completedVaccines.size}
              </span>
              <span className="text-[11px] text-muted-foreground">Completed</span>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 gap-0">
          <CardContent className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 shrink-0">
              <Clock className="size-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground tabular-nums leading-tight">
                {dueTodayCount}
              </span>
              <span className="text-[11px] text-muted-foreground">Due Today</span>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 gap-0">
          <CardContent className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-destructive/10 shrink-0">
              <ShieldAlert className="size-5 text-destructive" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground tabular-nums leading-tight">
                {Math.max(0, missedCount - [...completedVaccines].filter((id) => allVaccines.find((v) => v.id === id)?.status === "missed").length)}
              </span>
              <span className="text-[11px] text-muted-foreground">Missed</span>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4 gap-0">
          <CardContent className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
              <Syringe className="size-5 text-muted-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground tabular-nums leading-tight">
                {upcomingCount}
              </span>
              <span className="text-[11px] text-muted-foreground">Upcoming</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Missed Vaccines Alert ────────────────────────── */}
      {missedCount > 0 && (
        <Card className="gap-0 py-0 border-destructive/30 bg-destructive/[0.03]">
          <CardContent className="flex items-start gap-3 px-5 py-4">
            <div className="flex items-center justify-center size-9 rounded-lg bg-destructive/10 shrink-0 mt-0.5">
              <AlertTriangle className="size-4.5 text-destructive" />
            </div>
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-sm font-semibold text-foreground">
                {missedCount} Missed Vaccination{missedCount > 1 ? "s" : ""} Detected
              </span>
              <span className="text-xs text-muted-foreground leading-relaxed">
                OPV Dose 1 and Hepatitis B Dose 2 at the 6-month milestone were missed due to family travel.
                A catch-up dose for OPV was administered at 9 months. Hepatitis B catch-up is scheduled for today.
                Please ensure catch-up doses are administered per IAP guidelines.
              </span>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {allVaccines
                  .filter((v) => v.status === "missed" && !completedVaccines.has(v.id))
                  .map((v) => (
                    <Badge key={v.id} variant="destructive" className="text-[10px]">
                      {v.name} - {v.dose}
                    </Badge>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Main Layout: Timeline + Upcoming ─────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
        {/* Vaccination Schedule Timeline */}
        <Card className="gap-0 py-0">
          <CardHeader className="px-5 py-4 border-b border-border">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Syringe className="size-4 text-primary" />
              Vaccination Schedule Timeline
            </CardTitle>
            <CardDescription className="text-xs">
              IAP (Indian Academy of Pediatrics) recommended immunization schedule
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 py-5">
            <div className="flex flex-col">
              {vaccineGroups.map((group, groupIdx) => {
                const isExpanded = expandedGroups.has(group.ageLabel)
                const isLast = groupIdx === vaccineGroups.length - 1

                return (
                  <div key={group.ageLabel} className="flex gap-4">
                    {/* Timeline line + dot */}
                    <div className="flex flex-col items-center shrink-0 w-5">
                      <div
                        className={cn(
                          "size-4 rounded-full border-2 shrink-0 z-10",
                          groupDotColor(group)
                        )}
                      />
                      {!isLast && (
                        <div
                          className={cn(
                            "w-0.5 flex-1 min-h-4",
                            groupLineColor(group)
                          )}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn("flex flex-col flex-1 min-w-0", !isLast && "pb-4")}>
                      <button
                        onClick={() => toggleGroup(group.ageLabel)}
                        className="flex items-center justify-between w-full text-left group -mt-0.5"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">
                            {group.ageLabel}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {group.vaccines.length} vaccine{group.vaccines.length > 1 ? "s" : ""}
                          </span>
                          {group.vaccines.some((v) => getEffectiveStatus(v) === "missed") && (
                            <Badge variant="destructive" className="text-[10px] py-0">
                              Missed
                            </Badge>
                          )}
                          {group.vaccines.some((v) => getEffectiveStatus(v) === "due-today") && (
                            <Badge className="text-[10px] py-0">Due Today</Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="flex flex-col gap-2 mt-3">
                          {group.vaccines.map((vaccine) => {
                            const effStatus = getEffectiveStatus(vaccine)
                            const cfg = statusConfig[effStatus]
                            const StatusIcon = cfg.icon

                            return (
                              <div
                                key={vaccine.id}
                                className={cn(
                                  "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
                                  effStatus === "missed" && "border-destructive/20 bg-destructive/[0.02]",
                                  effStatus === "due-today" && "border-primary/20 bg-primary/[0.02]",
                                  effStatus === "completed" && "border-border",
                                  effStatus === "upcoming" && "border-border bg-muted/30"
                                )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5 min-w-0">
                                    <StatusIcon
                                      className={cn("size-4 mt-0.5 shrink-0", cfg.textClass)}
                                    />
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-medium text-foreground">
                                          {vaccine.name}
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                          {vaccine.dose}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                                        <span>Scheduled: {vaccine.scheduledDate}</span>
                                        {vaccine.administeredDate && (
                                          <span>Given: {vaccine.administeredDate}</span>
                                        )}
                                        {vaccine.site && <span>{vaccine.site}</span>}
                                      </div>
                                      {vaccine.batch && (
                                        <span className="text-[10px] text-muted-foreground/70">
                                          Batch: {vaccine.batch}
                                        </span>
                                      )}
                                      {vaccine.notes && (
                                        <span className="text-[11px] text-muted-foreground/80 italic mt-0.5">
                                          {vaccine.notes}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span
                                      className={cn(
                                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                        cfg.bgClass,
                                        cfg.textClass
                                      )}
                                    >
                                      <span
                                        className={cn("size-1.5 rounded-full", cfg.dotClass)}
                                        aria-hidden="true"
                                      />
                                      {cfg.label}
                                    </span>
                                    {(effStatus === "due-today" || effStatus === "missed") && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1 text-[11px] h-7 px-2 border-[#22a06b]/30 text-[#22a06b] hover:bg-[#22a06b]/5"
                                        onClick={() => markComplete(vaccine.id)}
                                      >
                                        <Check className="size-3" />
                                        <span className="hidden sm:inline">Mark Done</span>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ─── Right Sidebar: Upcoming + Actions ──────────── */}
        <div className="flex flex-col gap-4">
          {/* Due Today */}
          <Card className="gap-0 py-0 border-primary/20">
            <CardHeader className="px-4 py-3 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="size-4 text-primary" />
                Due Today
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 flex flex-col gap-2">
              {allVaccines
                .filter((v) => v.status === "due-today")
                .map((v) => {
                  const effStatus = getEffectiveStatus(v)
                  return (
                    <div
                      key={v.id}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg border p-2.5 transition-colors",
                        effStatus === "completed"
                          ? "border-[#22a06b]/20 bg-[#22a06b]/[0.03]"
                          : "border-primary/15 bg-primary/[0.02]"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Syringe
                          className={cn(
                            "size-3.5 shrink-0",
                            effStatus === "completed" ? "text-[#22a06b]" : "text-primary"
                          )}
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-foreground truncate">
                            {v.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{v.dose}</span>
                        </div>
                      </div>
                      {effStatus === "completed" ? (
                        <CircleCheck className="size-4 text-[#22a06b] shrink-0" />
                      ) : (
                        <Button
                          size="sm"
                          className="gap-1 text-[10px] h-6 px-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                          onClick={() => markComplete(v.id)}
                        >
                          <Check className="size-3" />
                          Done
                        </Button>
                      )}
                    </div>
                  )
                })}
              {allVaccines.filter((v) => v.status === "due-today").length === 0 && (
                <span className="text-xs text-muted-foreground text-center py-3">
                  No vaccines due today
                </span>
              )}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="gap-0 py-0">
            <CardHeader className="px-4 py-3 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CalendarDays className="size-4 text-muted-foreground" />
                Upcoming Vaccines
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 py-3 flex flex-col gap-2">
              {allVaccines
                .filter((v) => v.status === "upcoming")
                .map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CircleDashed className="size-3.5 text-muted-foreground shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-foreground truncate">
                          {v.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {v.dose} &middot; {v.scheduledDate}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {v.ageLabel}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>

          {/* Completion Progress */}
          <Card className="gap-0 py-0">
            <CardContent className="px-4 py-4 flex flex-col gap-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Immunization Progress
              </span>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    {Math.round(((completedCount + completedVaccines.size) / allVaccines.length) * 100)}%
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {completedCount + completedVaccines.size} / {allVaccines.length} doses
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#22a06b] transition-all duration-500"
                    style={{
                      width: `${((completedCount + completedVaccines.size) / allVaccines.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1 text-[11px] text-muted-foreground border-t border-border pt-4">
        <span>
          Reference: IAP Immunization Timetable 2024 &middot; National Immunization Schedule (NIS)
        </span>
        <span>
          Last updated: Feb 22, 2026 &middot; Next visit: Mar 20, 2026
        </span>
      </div>
    </div>
  )
}
