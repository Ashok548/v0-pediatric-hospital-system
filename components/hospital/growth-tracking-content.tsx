"use client"

import { useState } from "react"
import {
  Baby,
  Ruler,
  Weight,
  CircleDot,
  AlertTriangle,
  ArrowLeft,
  Printer,
  Download,
  CalendarDays,
  User2,
  Stethoscope,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  GrowthPercentileChart,
  type GrowthDataPoint,
} from "./growth-percentile-chart"

// ─── Patient Info ─────────────────────────────────────────────
const patient = {
  id: "PED-20240318",
  name: "Arya Sharma",
  dob: "Mar 18, 2025",
  age: "11 months",
  gender: "Female",
  bloodGroup: "B+",
  doctor: "Dr. Priya Reddy",
  lastVisit: "Feb 20, 2026",
  nextVisit: "Mar 20, 2026",
}

// ─── WHO-aligned data ─────────────────────────────────────────
// Weight-for-age (kg) -- Girls 0-12 months  (WHO 2006 standards)
const weightData: GrowthDataPoint[] = [
  { month: 0, value: 3.2, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  { month: 1, value: 3.8, p3: 3.2, p15: 3.6, p50: 4.2, p85: 4.8, p97: 5.4 },
  { month: 2, value: 4.6, p3: 3.9, p15: 4.4, p50: 5.1, p85: 5.8, p97: 6.5 },
  { month: 3, value: 5.2, p3: 4.5, p15: 5.1, p50: 5.8, p85: 6.6, p97: 7.4 },
  { month: 4, value: 5.7, p3: 5.0, p15: 5.6, p50: 6.4, p85: 7.3, p97: 8.1 },
  { month: 5, value: 6.1, p3: 5.4, p15: 6.1, p50: 6.9, p85: 7.8, p97: 8.7 },
  { month: 6, value: 6.3, p3: 5.7, p15: 6.4, p50: 7.3, p85: 8.2, p97: 9.2 },
  { month: 7, value: 6.6, p3: 6.0, p15: 6.7, p50: 7.6, p85: 8.6, p97: 9.6 },
  { month: 8, value: 6.8, p3: 6.2, p15: 7.0, p50: 7.9, p85: 9.0, p97: 10.0 },
  { month: 9, value: 7.0, p3: 6.4, p15: 7.2, p50: 8.2, p85: 9.3, p97: 10.4 },
  { month: 10, value: 7.1, p3: 6.5, p15: 7.4, p50: 8.5, p85: 9.6, p97: 10.7 },
  { month: 11, value: 7.2, p3: 6.7, p15: 7.6, p50: 8.7, p85: 9.9, p97: 11.0 },
]

// Length-for-age (cm) -- Girls 0-12 months
const heightData: GrowthDataPoint[] = [
  { month: 0, value: 49.0, p3: 45.4, p15: 47.3, p50: 49.1, p85: 51.0, p97: 52.9 },
  { month: 1, value: 52.5, p3: 49.8, p15: 51.3, p50: 53.7, p85: 55.6, p97: 57.6 },
  { month: 2, value: 55.8, p3: 53.0, p15: 54.7, p50: 57.1, p85: 59.1, p97: 61.1 },
  { month: 3, value: 58.5, p3: 55.6, p15: 57.4, p50: 59.8, p85: 61.9, p97: 63.9 },
  { month: 4, value: 60.2, p3: 57.8, p15: 59.6, p50: 62.1, p85: 64.2, p97: 66.3 },
  { month: 5, value: 62.5, p3: 59.6, p15: 61.5, p50: 64.0, p85: 66.2, p97: 68.2 },
  { month: 6, value: 64.0, p3: 61.2, p15: 63.2, p50: 65.7, p85: 67.8, p97: 70.0 },
  { month: 7, value: 65.2, p3: 62.7, p15: 64.6, p50: 67.3, p85: 69.4, p97: 71.6 },
  { month: 8, value: 66.4, p3: 64.0, p15: 66.0, p50: 68.7, p85: 70.9, p97: 73.2 },
  { month: 9, value: 67.5, p3: 65.3, p15: 67.3, p50: 70.1, p85: 72.3, p97: 74.5 },
  { month: 10, value: 68.2, p3: 66.5, p15: 68.5, p50: 71.5, p85: 73.7, p97: 75.9 },
  { month: 11, value: 69.0, p3: 67.7, p15: 69.7, p50: 72.8, p85: 75.0, p97: 77.2 },
]

// Head circumference-for-age (cm) -- Girls 0-12 months
const hcData: GrowthDataPoint[] = [
  { month: 0, value: 33.5, p3: 31.5, p15: 32.7, p50: 33.9, p85: 35.1, p97: 36.2 },
  { month: 1, value: 35.8, p3: 34.0, p15: 35.1, p50: 36.5, p85: 37.7, p97: 38.9 },
  { month: 2, value: 37.0, p3: 35.7, p15: 36.9, p50: 38.3, p85: 39.5, p97: 40.7 },
  { month: 3, value: 38.5, p3: 37.1, p15: 38.2, p50: 39.5, p85: 40.9, p97: 42.0 },
  { month: 4, value: 39.5, p3: 38.1, p15: 39.2, p50: 40.6, p85: 41.8, p97: 43.0 },
  { month: 5, value: 40.5, p3: 38.9, p15: 40.1, p50: 41.5, p85: 42.7, p97: 43.8 },
  { month: 6, value: 41.2, p3: 39.6, p15: 40.7, p50: 42.2, p85: 43.4, p97: 44.6 },
  { month: 7, value: 42.0, p3: 40.2, p15: 41.3, p50: 42.8, p85: 44.1, p97: 45.2 },
  { month: 8, value: 42.5, p3: 40.6, p15: 41.8, p50: 43.4, p85: 44.6, p97: 45.8 },
  { month: 9, value: 43.0, p3: 41.0, p15: 42.2, p50: 43.8, p85: 45.1, p97: 46.2 },
  { month: 10, value: 43.3, p3: 41.4, p15: 42.6, p50: 44.2, p85: 45.5, p97: 46.7 },
  { month: 11, value: 43.5, p3: 41.7, p15: 42.9, p50: 44.6, p85: 45.9, p97: 47.0 },
]

// ─── Risk evaluation ──────────────────────────────────────────
function evaluatePercentile(data: GrowthDataPoint[]): {
  percentile: number
  status: "normal" | "warning" | "critical"
} {
  const latest = data[data.length - 1]
  if (latest.value < latest.p3)
    return { percentile: 2, status: "critical" }
  if (latest.value < latest.p15)
    return { percentile: 10, status: "warning" }
  if (latest.value < latest.p50)
    return { percentile: 30, status: "normal" }
  if (latest.value < latest.p85)
    return { percentile: 60, status: "normal" }
  if (latest.value < latest.p97)
    return { percentile: 90, status: "normal" }
  return { percentile: 98, status: "normal" }
}

const weightEval = evaluatePercentile(weightData)
const heightEval = evaluatePercentile(heightData)
const hcEval = evaluatePercentile(hcData)

const risks: { label: string; message: string; severity: "critical" | "warning" }[] = []

if (weightEval.status === "critical")
  risks.push({
    label: "Underweight",
    message: `Weight is below the 3rd percentile (P${weightEval.percentile}). Immediate nutritional assessment recommended per WHO guidelines.`,
    severity: "critical",
  })
else if (weightEval.status === "warning")
  risks.push({
    label: "Low Weight",
    message: `Weight is between 3rd and 15th percentile (P${weightEval.percentile}). Monitor closely at next visit.`,
    severity: "warning",
  })

if (heightEval.status === "critical")
  risks.push({
    label: "Stunted Growth",
    message: `Length/height is below the 3rd percentile (P${heightEval.percentile}). Consider endocrine referral.`,
    severity: "critical",
  })
else if (heightEval.status === "warning")
  risks.push({
    label: "Short Stature Risk",
    message: `Length/height is between 3rd and 15th percentile (P${heightEval.percentile}). Continue monitoring.`,
    severity: "warning",
  })

if (hcEval.status === "critical")
  risks.push({
    label: "Microcephaly Risk",
    message: `Head circumference is below the 3rd percentile (P${hcEval.percentile}). Neurology evaluation recommended.`,
    severity: "critical",
  })

// ─── Summary stats ────────────────────────────────────────────
const summaryStats = [
  {
    label: "Weight",
    value: `${weightData[weightData.length - 1].value} kg`,
    percentile: `P${weightEval.percentile}`,
    icon: Weight,
    status: weightEval.status,
  },
  {
    label: "Height",
    value: `${heightData[heightData.length - 1].value} cm`,
    percentile: `P${heightEval.percentile}`,
    icon: Ruler,
    status: heightEval.status,
  },
  {
    label: "Head Circ.",
    value: `${hcData[hcData.length - 1].value} cm`,
    percentile: `P${hcEval.percentile}`,
    icon: CircleDot,
    status: hcEval.status,
  },
]

// ─── Component ────────────────────────────────────────────────
export function GrowthTrackingContent() {
  const [standard, setStandard] = useState("who")

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-[1600px] mx-auto">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/patients"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Patients
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">Growth Tracking</span>
      </div>

      {/* Patient Header */}
      <Card className="gap-0 py-0">
        <CardContent className="px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Patient identity */}
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center size-14 rounded-full bg-primary/10 shrink-0">
                <Baby className="size-7 text-primary" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg font-bold text-foreground tracking-tight">
                    {patient.name}
                  </h1>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {patient.id}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" />
                    DOB: {patient.dob}
                  </span>
                  <span className="flex items-center gap-1">
                    <User2 className="size-3" />
                    {patient.age} &middot; {patient.gender}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="size-3" />
                    {patient.doctor}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Select value={standard} onValueChange={setStandard}>
                <SelectTrigger size="sm" className="w-[180px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="who">WHO Standards (2006)</SelectItem>
                  <SelectItem value="cdc">CDC Growth Charts</SelectItem>
                  <SelectItem value="iap">IAP Standards</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Printer className="size-3.5" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Download className="size-3.5" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Measurement Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {summaryStats.map((stat) => {
          const statusColor =
            stat.status === "critical"
              ? { bg: "bg-destructive/8", text: "text-destructive", dot: "bg-destructive" }
              : stat.status === "warning"
                ? { bg: "bg-warning/10", text: "text-warning-foreground", dot: "bg-warning" }
                : { bg: "bg-success/8", text: "text-success", dot: "bg-success" }

          return (
            <Card key={stat.label} className="py-4 gap-0">
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 shrink-0">
                    <stat.icon className="size-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      {stat.label}
                    </span>
                    <span className="text-xl font-bold text-foreground tabular-nums leading-tight">
                      {stat.value}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    statusColor.bg,
                    statusColor.text
                  )}
                >
                  <span className={cn("size-1.5 rounded-full", statusColor.dot)} aria-hidden="true" />
                  {stat.percentile}
                </span>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Risk Warnings */}
      {risks.length > 0 && (
        <Card
          className={cn(
            "gap-0 py-0",
            risks.some((r) => r.severity === "critical")
              ? "border-destructive/30 bg-destructive/[0.03]"
              : "border-warning/30 bg-warning/[0.03]"
          )}
        >
          <CardHeader className="px-5 py-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle
                className={cn(
                  "size-4",
                  risks.some((r) => r.severity === "critical")
                    ? "text-destructive"
                    : "text-warning-foreground"
                )}
              />
              Growth Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 flex flex-col gap-3">
            {risks.map((risk) => (
              <div key={risk.label} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0",
                    risk.severity === "critical"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-warning/10 text-warning-foreground"
                  )}
                >
                  {risk.severity}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-semibold text-foreground">{risk.label}</span>
                  <span className="text-xs text-muted-foreground leading-relaxed">{risk.message}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Growth Charts */}
      <div className="flex flex-col gap-4">
        <GrowthPercentileChart
          title="Weight-for-Age"
          description="WHO Child Growth Standards - Girls, 0-12 months"
          unit="kg"
          data={weightData}
          currentPercentile={weightEval.percentile}
          status={weightEval.status}
        />
        <GrowthPercentileChart
          title="Length/Height-for-Age"
          description="WHO Child Growth Standards - Girls, 0-12 months"
          unit="cm"
          data={heightData}
          currentPercentile={heightEval.percentile}
          status={heightEval.status}
        />
        <GrowthPercentileChart
          title="Head Circumference-for-Age"
          description="WHO Child Growth Standards - Girls, 0-12 months"
          unit="cm"
          data={hcData}
          currentPercentile={hcEval.percentile}
          status={hcEval.status}
        />
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1 text-[11px] text-muted-foreground border-t border-border pt-4">
        <span>
          Reference: WHO Child Growth Standards (2006) &middot; Percentile calculation based on LMS method
        </span>
        <span>
          Last measurement recorded: {patient.lastVisit} &middot; Next scheduled visit: {patient.nextVisit}
        </span>
      </div>
    </div>
  )
}
