"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Baby,
  HeartPulse,
  AlertTriangle,
  Filter,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NicuBabyCard, type NicuBaby, type BabyStatus } from "./nicu-baby-card"
import { TooltipProvider } from "@/components/ui/tooltip"

const nicuBabies: NicuBaby[] = [
  {
    id: "N-001",
    name: "Baby Arjun Gupta",
    bed: "N-01",
    gestationalAge: "32 weeks + 4 days",
    weight: "1.8 kg",
    status: "critical",
    vitals: { heartRate: 188, spo2: 86, temperature: 36.1 },
    alerts: ["SpO2 Low", "Tachycardia"],
    admittedDate: "Feb 18, 2026",
    doctor: "Meena Iyer",
  },
  {
    id: "N-002",
    name: "Baby Aisha Khan",
    bed: "N-02",
    gestationalAge: "34 weeks + 1 day",
    weight: "2.1 kg",
    status: "stable",
    vitals: { heartRate: 142, spo2: 96, temperature: 36.8 },
    alerts: [],
    admittedDate: "Feb 19, 2026",
    doctor: "Rajiv Sharma",
  },
  {
    id: "N-003",
    name: "Baby Vihaan Reddy",
    bed: "N-03",
    gestationalAge: "28 weeks + 6 days",
    weight: "1.1 kg",
    status: "critical",
    vitals: { heartRate: 192, spo2: 84, temperature: 35.8 },
    alerts: ["Ventilator", "SpO2 Critical", "Hypothermia"],
    admittedDate: "Feb 15, 2026",
    doctor: "Meena Iyer",
  },
  {
    id: "N-004",
    name: "Baby Saanvi Patel",
    bed: "N-04",
    gestationalAge: "36 weeks + 0 days",
    weight: "2.4 kg",
    status: "stable",
    vitals: { heartRate: 138, spo2: 97, temperature: 36.7 },
    alerts: [],
    admittedDate: "Feb 21, 2026",
    doctor: "Priya Reddy",
  },
  {
    id: "N-005",
    name: "Baby Kabir Singh",
    bed: "N-05",
    gestationalAge: "30 weeks + 2 days",
    weight: "1.4 kg",
    status: "warning",
    vitals: { heartRate: 168, spo2: 91, temperature: 37.6 },
    alerts: ["SpO2 Borderline"],
    admittedDate: "Feb 17, 2026",
    doctor: "Rajiv Sharma",
  },
  {
    id: "N-006",
    name: "Baby Myra Nair",
    bed: "N-06",
    gestationalAge: "33 weeks + 5 days",
    weight: "1.9 kg",
    status: "stable",
    vitals: { heartRate: 145, spo2: 95, temperature: 36.6 },
    alerts: [],
    admittedDate: "Feb 20, 2026",
    doctor: "Meena Iyer",
  },
  {
    id: "N-007",
    name: "Baby Reyansh Das",
    bed: "N-07",
    gestationalAge: "29 weeks + 3 days",
    weight: "1.2 kg",
    status: "warning",
    vitals: { heartRate: 172, spo2: 90, temperature: 37.4 },
    alerts: ["Elevated HR"],
    admittedDate: "Feb 16, 2026",
    doctor: "Priya Reddy",
  },
  {
    id: "N-008",
    name: "Baby Ananya Joshi",
    bed: "N-08",
    gestationalAge: "35 weeks + 2 days",
    weight: "2.3 kg",
    status: "stable",
    vitals: { heartRate: 136, spo2: 98, temperature: 36.9 },
    alerts: [],
    admittedDate: "Feb 21, 2026",
    doctor: "Rajiv Sharma",
  },
  {
    id: "N-009",
    name: "Baby Ishaan Mehta",
    bed: "N-09",
    gestationalAge: "31 weeks + 0 days",
    weight: "1.5 kg",
    status: "warning",
    vitals: { heartRate: 165, spo2: 91, temperature: 37.3 },
    alerts: ["Mild Apnea"],
    admittedDate: "Feb 18, 2026",
    doctor: "Meena Iyer",
  },
  {
    id: "N-010",
    name: "Baby Zara Ali",
    bed: "N-10",
    gestationalAge: "27 weeks + 5 days",
    weight: "0.98 kg",
    status: "critical",
    vitals: { heartRate: 195, spo2: 82, temperature: 35.6 },
    alerts: ["Ventilator", "Bradycardia Episodes", "Hypothermia"],
    admittedDate: "Feb 14, 2026",
    doctor: "Meena Iyer",
  },
  {
    id: "N-011",
    name: "Baby Advait Rao",
    bed: "N-11",
    gestationalAge: "34 weeks + 3 days",
    weight: "2.0 kg",
    status: "stable",
    vitals: { heartRate: 140, spo2: 96, temperature: 36.7 },
    alerts: [],
    admittedDate: "Feb 20, 2026",
    doctor: "Priya Reddy",
  },
  {
    id: "N-012",
    name: "Baby Diya Kapoor",
    bed: "N-12",
    gestationalAge: "32 weeks + 1 day",
    weight: "1.6 kg",
    status: "stable",
    vitals: { heartRate: 148, spo2: 94, temperature: 36.5 },
    alerts: [],
    admittedDate: "Feb 19, 2026",
    doctor: "Rajiv Sharma",
  },
]

type FilterOption = "all" | BabyStatus

function SummaryCard({
  label,
  value,
  icon: Icon,
  iconClass,
  bgClass,
  active,
  onClick,
}: {
  label: string
  value: number
  icon: React.ElementType
  iconClass: string
  bgClass: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left",
        active
          ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-primary/20"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center size-10 rounded-lg shrink-0",
          bgClass
        )}
      >
        <Icon className={cn("size-5", iconClass)} />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-foreground leading-tight tabular-nums">
          {value}
        </span>
        <span className="text-[11px] text-muted-foreground leading-tight">
          {label}
        </span>
      </div>
    </button>
  )
}

export function NicuContent() {
  const [filter, setFilter] = useState<FilterOption>("all")

  const totalBabies = nicuBabies.length
  const criticalCount = nicuBabies.filter((b) => b.status === "critical").length
  const warningCount = nicuBabies.filter((b) => b.status === "warning").length
  const stableCount = nicuBabies.filter((b) => b.status === "stable").length

  const filteredBabies =
    filter === "all"
      ? nicuBabies
      : nicuBabies.filter((b) => b.status === filter)

  // Sort: critical first, then warning, then stable
  const sortedBabies = [...filteredBabies].sort((a, b) => {
    const order: Record<BabyStatus, number> = { critical: 0, warning: 1, stable: 2 }
    return order[a.status] - order[b.status]
  })

  return (
    <TooltipProvider delayDuration={0}>
      <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight text-balance">
                NICU Monitoring
              </h1>
              <Badge
                variant="destructive"
                className="text-[10px] animate-pulse uppercase tracking-wider"
              >
                Live
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Neonatal Intensive Care Unit &middot; Real-time vitals and status
              for all admitted neonates
            </p>
          </div>
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Filter className="size-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <RefreshCw className="size-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SummaryCard
            label="Total Neonates"
            value={totalBabies}
            icon={Baby}
            iconClass="text-primary"
            bgClass="bg-primary/10"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <SummaryCard
            label="Critical"
            value={criticalCount}
            icon={AlertTriangle}
            iconClass="text-destructive"
            bgClass="bg-destructive/10"
            active={filter === "critical"}
            onClick={() => setFilter("critical")}
          />
          <SummaryCard
            label="Warning"
            value={warningCount}
            icon={HeartPulse}
            iconClass="text-warning-foreground"
            bgClass="bg-warning/10"
            active={filter === "warning"}
            onClick={() => setFilter("warning")}
          />
          <SummaryCard
            label="Stable"
            value={stableCount}
            icon={HeartPulse}
            iconClass="text-success"
            bgClass="bg-success/10"
            active={filter === "stable"}
            onClick={() => setFilter("stable")}
          />
        </div>

        {/* Critical Banner */}
        {criticalCount > 0 && filter !== "stable" && filter !== "warning" && (
          <Card className="border-destructive/30 bg-destructive/[0.03] py-0">
            <CardContent className="flex items-center gap-3 px-4 py-3">
              <div className="flex items-center justify-center size-8 rounded-lg bg-destructive/10 shrink-0">
                <AlertTriangle className="size-4 text-destructive" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-semibold text-foreground">
                  {criticalCount} Neonate{criticalCount > 1 ? "s" : ""} in
                  Critical Condition
                </span>
                <span className="text-xs text-muted-foreground">
                  Immediate medical attention required. Attending physicians
                  have been notified.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Baby Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedBabies.map((baby) => (
            <NicuBabyCard key={baby.id} baby={baby} />
          ))}
        </div>

        {/* Empty State */}
        {sortedBabies.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Baby className="size-10 text-muted-foreground/40 mb-3" />
            <span className="text-sm font-medium text-muted-foreground">
              No neonates match the selected filter
            </span>
          </div>
        )}

        {/* Footer timestamp */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-4">
          <span>
            Last updated: Feb 22, 2026 &middot; 10:34 AM IST
          </span>
          <span>
            Showing {sortedBabies.length} of {totalBabies} neonates
          </span>
        </div>
      </div>
    </TooltipProvider>
  )
}
