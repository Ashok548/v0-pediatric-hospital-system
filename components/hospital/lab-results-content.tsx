"use client"

import { useState, useMemo } from "react"
import {
  ArrowLeft,
  Baby,
  CalendarDays,
  User2,
  Stethoscope,
  FlaskConical,
  Save,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Printer,
  ArrowDown,
  ArrowUp,
  Minus,
  Clock,
  ChevronDown,
  CircleDot,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// ─── Patient Data ───────────────────────────────────────────────
const patient = {
  id: "PED-20260189",
  name: "Aarav Sharma",
  dob: "Mar 15, 2023",
  age: "2 years 11 months",
  gender: "Male",
  bloodGroup: "B+",
  weight: "12.5 kg",
  ward: "Pediatric Ward B",
  bed: "PW-B-14",
  doctor: "Dr. Priya Reddy",
  diagnosis: "Acute Bronchopneumonia",
  guardian: "Meera Sharma (Mother)",
}

// ─── Test Panels ────────────────────────────────────────────────
type StatusType = "normal" | "low" | "high" | "critical-low" | "critical-high" | "pending"

interface ParameterRow {
  id: string
  name: string
  value: string
  unit: string
  refMin: number
  refMax: number
  criticalMin: number
  criticalMax: number
  refDisplay: string
}

interface TestPanel {
  id: string
  name: string
  category: string
  sampleType: string
  collectedAt: string
  receivedAt: string
  parameters: ParameterRow[]
}

const testPanels: TestPanel[] = [
  {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    category: "Hematology",
    sampleType: "EDTA Blood",
    collectedAt: "22 Feb 2026, 07:30 AM",
    receivedAt: "22 Feb 2026, 07:45 AM",
    parameters: [
      { id: "hb", name: "Hemoglobin", value: "9.8", unit: "g/dL", refMin: 11.0, refMax: 14.5, criticalMin: 7.0, criticalMax: 20.0, refDisplay: "11.0 - 14.5" },
      { id: "rbc", name: "RBC Count", value: "4.1", unit: "million/uL", refMin: 3.9, refMax: 5.3, criticalMin: 2.5, criticalMax: 7.0, refDisplay: "3.9 - 5.3" },
      { id: "wbc", name: "WBC Count", value: "18200", unit: "/uL", refMin: 5000, refMax: 15000, criticalMin: 2000, criticalMax: 30000, refDisplay: "5,000 - 15,000" },
      { id: "platelets", name: "Platelet Count", value: "142000", unit: "/uL", refMin: 150000, refMax: 400000, criticalMin: 50000, criticalMax: 1000000, refDisplay: "1,50,000 - 4,00,000" },
      { id: "hct", name: "Hematocrit (PCV)", value: "31.2", unit: "%", refMin: 33.0, refMax: 42.0, criticalMin: 20.0, criticalMax: 60.0, refDisplay: "33.0 - 42.0" },
      { id: "mcv", name: "MCV", value: "76.1", unit: "fL", refMin: 75.0, refMax: 87.0, criticalMin: 50.0, criticalMax: 110.0, refDisplay: "75.0 - 87.0" },
      { id: "mch", name: "MCH", value: "23.9", unit: "pg", refMin: 24.0, refMax: 30.0, criticalMin: 15.0, criticalMax: 40.0, refDisplay: "24.0 - 30.0" },
      { id: "neutrophils", name: "Neutrophils", value: "72", unit: "%", refMin: 30, refMax: 60, criticalMin: 10, criticalMax: 90, refDisplay: "30 - 60" },
      { id: "lymphocytes", name: "Lymphocytes", value: "20", unit: "%", refMin: 30, refMax: 60, criticalMin: 5, criticalMax: 80, refDisplay: "30 - 60" },
      { id: "esr", name: "ESR", value: "38", unit: "mm/hr", refMin: 0, refMax: 15, criticalMin: 0, criticalMax: 100, refDisplay: "0 - 15" },
    ],
  },
  {
    id: "crp",
    name: "C-Reactive Protein (CRP)",
    category: "Biochemistry",
    sampleType: "Serum",
    collectedAt: "22 Feb 2026, 07:30 AM",
    receivedAt: "22 Feb 2026, 07:50 AM",
    parameters: [
      { id: "crp_quant", name: "CRP Quantitative", value: "48.6", unit: "mg/L", refMin: 0, refMax: 5, criticalMin: 0, criticalMax: 200, refDisplay: "< 5.0" },
    ],
  },
  {
    id: "lft",
    name: "Liver Function Test (LFT)",
    category: "Biochemistry",
    sampleType: "Serum",
    collectedAt: "22 Feb 2026, 07:30 AM",
    receivedAt: "22 Feb 2026, 07:55 AM",
    parameters: [
      { id: "bilirubin_total", name: "Total Bilirubin", value: "0.8", unit: "mg/dL", refMin: 0.1, refMax: 1.2, criticalMin: 0, criticalMax: 15, refDisplay: "0.1 - 1.2" },
      { id: "sgot", name: "SGOT (AST)", value: "42", unit: "U/L", refMin: 8, refMax: 40, criticalMin: 0, criticalMax: 500, refDisplay: "8 - 40" },
      { id: "sgpt", name: "SGPT (ALT)", value: "34", unit: "U/L", refMin: 7, refMax: 40, criticalMin: 0, criticalMax: 500, refDisplay: "7 - 40" },
      { id: "alp", name: "Alkaline Phosphatase", value: "280", unit: "U/L", refMin: 100, refMax: 350, criticalMin: 0, criticalMax: 1000, refDisplay: "100 - 350" },
      { id: "albumin", name: "Albumin", value: "3.4", unit: "g/dL", refMin: 3.5, refMax: 5.0, criticalMin: 1.5, criticalMax: 6.5, refDisplay: "3.5 - 5.0" },
      { id: "total_protein", name: "Total Protein", value: "6.2", unit: "g/dL", refMin: 6.0, refMax: 8.0, criticalMin: 3.0, criticalMax: 12.0, refDisplay: "6.0 - 8.0" },
    ],
  },
  {
    id: "rft",
    name: "Renal Function Test (RFT)",
    category: "Biochemistry",
    sampleType: "Serum",
    collectedAt: "22 Feb 2026, 07:30 AM",
    receivedAt: "22 Feb 2026, 07:55 AM",
    parameters: [
      { id: "urea", name: "Blood Urea", value: "22", unit: "mg/dL", refMin: 10, refMax: 40, criticalMin: 0, criticalMax: 150, refDisplay: "10 - 40" },
      { id: "creatinine", name: "Serum Creatinine", value: "0.3", unit: "mg/dL", refMin: 0.2, refMax: 0.5, criticalMin: 0, criticalMax: 5, refDisplay: "0.2 - 0.5" },
      { id: "sodium", name: "Sodium", value: "136", unit: "mEq/L", refMin: 135, refMax: 145, criticalMin: 120, criticalMax: 160, refDisplay: "135 - 145" },
      { id: "potassium", name: "Potassium", value: "5.6", unit: "mEq/L", refMin: 3.5, refMax: 5.0, criticalMin: 2.5, criticalMax: 6.5, refDisplay: "3.5 - 5.0" },
      { id: "chloride", name: "Chloride", value: "101", unit: "mEq/L", refMin: 96, refMax: 106, criticalMin: 80, criticalMax: 120, refDisplay: "96 - 106" },
    ],
  },
]

// ─── Helpers ────────────────────────────────────────────────────
function getStatus(val: string, param: ParameterRow): StatusType {
  if (!val || val.trim() === "") return "pending"
  const num = parseFloat(val)
  if (isNaN(num)) return "pending"
  if (num < param.criticalMin || num > param.criticalMax) return num < param.criticalMin ? "critical-low" : "critical-high"
  if (num < param.refMin) return "low"
  if (num > param.refMax) return "high"
  return "normal"
}

function StatusBadge({ status }: { status: StatusType }) {
  switch (status) {
    case "normal":
      return (
        <Badge className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 gap-1">
          <CheckCircle2 className="size-3" />
          Normal
        </Badge>
      )
    case "low":
      return (
        <Badge className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 gap-1">
          <ArrowDown className="size-3" />
          Low
        </Badge>
      )
    case "high":
      return (
        <Badge className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-50 gap-1">
          <ArrowUp className="size-3" />
          High
        </Badge>
      )
    case "critical-low":
      return (
        <Badge className="text-[10px] font-semibold bg-red-50 text-red-700 border border-red-300 hover:bg-red-50 gap-1 animate-pulse">
          <AlertTriangle className="size-3" />
          Critical Low
        </Badge>
      )
    case "critical-high":
      return (
        <Badge className="text-[10px] font-semibold bg-red-50 text-red-700 border border-red-300 hover:bg-red-50 gap-1 animate-pulse">
          <AlertTriangle className="size-3" />
          Critical High
        </Badge>
      )
    case "pending":
      return (
        <Badge variant="secondary" className="text-[10px] font-medium gap-1">
          <Minus className="size-3" />
          Pending
        </Badge>
      )
  }
}

function TrendIcon({ status }: { status: StatusType }) {
  if (status === "high" || status === "critical-high") return <ArrowUp className="size-3.5 text-red-600" />
  if (status === "low" || status === "critical-low") return <ArrowDown className="size-3.5 text-red-600" />
  if (status === "normal") return <CheckCircle2 className="size-3.5 text-emerald-600" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

// ─── Component ──────────────────────────────────────────────────
export function LabResultsContent() {
  const [selectedPanelId, setSelectedPanelId] = useState<string>("cbc")
  const [panelValues, setPanelValues] = useState<Record<string, Record<string, string>>>(() => {
    const initial: Record<string, Record<string, string>> = {}
    testPanels.forEach((panel) => {
      initial[panel.id] = {}
      panel.parameters.forEach((p) => {
        initial[panel.id][p.id] = p.value
      })
    })
    return initial
  })
  const [savedDraft, setSavedDraft] = useState(false)
  const [finalized, setFinalized] = useState(false)
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)
  const [technicianNotes, setTechnicianNotes] = useState("")

  const selectedPanel = testPanels.find((p) => p.id === selectedPanelId)!

  const updateValue = (parameterId: string, value: string) => {
    setPanelValues((prev) => ({
      ...prev,
      [selectedPanelId]: {
        ...prev[selectedPanelId],
        [parameterId]: value,
      },
    }))
    setSavedDraft(false)
    setFinalized(false)
  }

  const resetToOriginal = () => {
    const original: Record<string, string> = {}
    selectedPanel.parameters.forEach((p) => {
      original[p.id] = p.value
    })
    setPanelValues((prev) => ({
      ...prev,
      [selectedPanelId]: original,
    }))
    setSavedDraft(false)
    setFinalized(false)
  }

  // Compute summary counts
  const summary = useMemo(() => {
    const values = panelValues[selectedPanelId] || {}
    let normal = 0
    let abnormal = 0
    let critical = 0
    let pending = 0
    selectedPanel.parameters.forEach((p) => {
      const val = values[p.id] ?? ""
      const status = getStatus(val, p)
      if (status === "normal") normal++
      else if (status === "critical-low" || status === "critical-high") critical++
      else if (status === "low" || status === "high") abnormal++
      else pending++
    })
    return { normal, abnormal, critical, pending, total: selectedPanel.parameters.length }
  }, [panelValues, selectedPanelId, selectedPanel])

  // All panels summary
  const allPanelsSummary = useMemo(() => {
    let totalAbnormal = 0
    let totalCritical = 0
    testPanels.forEach((panel) => {
      const values = panelValues[panel.id] || {}
      panel.parameters.forEach((p) => {
        const val = values[p.id] ?? ""
        const status = getStatus(val, p)
        if (status === "critical-low" || status === "critical-high") totalCritical++
        else if (status === "low" || status === "high") totalAbnormal++
      })
    })
    return { totalAbnormal, totalCritical }
  }, [panelValues])

  const handleSaveDraft = () => {
    setSavedDraft(true)
    setFinalized(false)
  }

  const handleFinalize = () => {
    setFinalizeDialogOpen(false)
    setFinalized(true)
    setSavedDraft(false)
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1200px] mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/lab"
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Lab
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">Lab Result Entry</span>
      </div>

      {/* ─── Patient Header ──────────────────────────────────── */}
      <Card className="gap-0 py-0">
        <CardContent className="px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center size-14 rounded-full bg-primary/10 shrink-0">
                <Baby className="size-7 text-primary" />
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg font-bold text-foreground tracking-tight">
                    {patient.name}
                  </h1>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {patient.id}
                  </Badge>
                  <Badge className="text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">
                    {patient.bloodGroup}
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
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>Ward: {patient.ward}</span>
                  <span>Bed: {patient.bed}</span>
                  <span>Wt: {patient.weight}</span>
                  <span>Dx: {patient.diagnosis}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/50 px-4 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lab Order</span>
                <span className="text-sm font-bold text-foreground mt-0.5">LO-2026-4521</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="size-2.5" />
                  22 Feb 2026
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Critical Alert Banner ───────────────────────────── */}
      {allPanelsSummary.totalCritical > 0 && (
        <div className="flex items-center gap-3 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3">
          <div className="flex items-center justify-center size-9 rounded-full bg-red-100 shrink-0">
            <AlertTriangle className="size-5 text-red-600" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-red-700">
              {allPanelsSummary.totalCritical} Critical Value{allPanelsSummary.totalCritical !== 1 ? "s" : ""} Detected
            </span>
            <span className="text-xs text-red-600">
              Immediate clinical attention required. Please inform the treating physician.
            </span>
          </div>
        </div>
      )}

      {/* ─── Panel Selector + Summary ────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Left: Test Panels Nav */}
        <div className="flex flex-col gap-2 lg:w-64 shrink-0">
          <Label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-1">Test Panels</Label>
          <div className="flex flex-col gap-1">
            {testPanels.map((panel) => {
              const isActive = panel.id === selectedPanelId
              const pValues = panelValues[panel.id] || {}
              let panelHasCritical = false
              let panelHasAbnormal = false
              panel.parameters.forEach((p) => {
                const status = getStatus(pValues[p.id] ?? "", p)
                if (status === "critical-low" || status === "critical-high") panelHasCritical = true
                else if (status === "low" || status === "high") panelHasAbnormal = true
              })
              return (
                <button
                  key={panel.id}
                  onClick={() => setSelectedPanelId(panel.id)}
                  className={cn(
                    "flex items-center gap-3 text-left rounded-lg px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold border border-primary/20"
                      : "text-foreground hover:bg-muted border border-transparent"
                  )}
                >
                  <FlaskConical className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="truncate flex-1">{panel.name.split("(")[0].trim()}</span>
                  {panelHasCritical && <span className="size-2.5 rounded-full bg-red-500 shrink-0 animate-pulse" />}
                  {!panelHasCritical && panelHasAbnormal && <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />}
                  {!panelHasCritical && !panelHasAbnormal && <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Results Table */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Panel Header */}
          <Card className="gap-0 py-0">
            <CardHeader className="px-5 py-4 border-b border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <FlaskConical className="size-4 text-primary" />
                    {selectedPanel.name}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {selectedPanel.category} &middot; Sample: {selectedPanel.sampleType} &middot; Collected: {selectedPanel.collectedAt}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">{summary.normal} Normal</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span className="text-muted-foreground">{summary.abnormal} Abnormal</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="size-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">{summary.critical} Critical</span>
                  </div>
                  {summary.pending > 0 && (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="size-2 rounded-full bg-muted-foreground/30" />
                      <span className="text-muted-foreground">{summary.pending} Pending</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-0 py-0">
              {/* Table Header */}
              <div className="hidden sm:grid grid-cols-[minmax(160px,2fr)_minmax(90px,1fr)_minmax(60px,0.7fr)_minmax(100px,1.2fr)_minmax(90px,1fr)_40px] gap-x-3 px-5 py-2.5 bg-muted/50 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Parameter</span>
                <span>Value</span>
                <span>Unit</span>
                <span>Reference Range</span>
                <span>Status</span>
                <span />
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-border">
                {selectedPanel.parameters.map((param) => {
                  const currentValue = panelValues[selectedPanelId]?.[param.id] ?? ""
                  const status = getStatus(currentValue, param)
                  const isAbnormal = status === "low" || status === "high" || status === "critical-low" || status === "critical-high"
                  const isCritical = status === "critical-low" || status === "critical-high"

                  return (
                    <div
                      key={param.id}
                      className={cn(
                        "flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(160px,2fr)_minmax(90px,1fr)_minmax(60px,0.7fr)_minmax(100px,1.2fr)_minmax(90px,1fr)_40px] sm:gap-x-3 sm:items-center px-5 py-3 transition-colors",
                        isCritical && "bg-red-50/80",
                        !isCritical && isAbnormal && "bg-amber-50/50",
                      )}
                    >
                      {/* Parameter Name */}
                      <div className="flex items-center gap-2">
                        <CircleDot className={cn(
                          "size-3 shrink-0",
                          isCritical ? "text-red-500" : isAbnormal ? "text-amber-500" : status === "normal" ? "text-emerald-500" : "text-muted-foreground/40"
                        )} />
                        <span className={cn(
                          "text-sm",
                          isCritical ? "font-bold text-red-700" : isAbnormal ? "font-semibold text-foreground" : "font-medium text-foreground"
                        )}>
                          {param.name}
                        </span>
                        <span className="sm:hidden text-[10px] text-muted-foreground">({param.unit})</span>
                      </div>

                      {/* Value Input */}
                      <div className="flex items-center gap-2 sm:block">
                        <Label className="sm:hidden text-xs text-muted-foreground w-16 shrink-0">Value</Label>
                        <Input
                          type="text"
                          value={currentValue}
                          onChange={(e) => updateValue(param.id, e.target.value)}
                          disabled={finalized}
                          className={cn(
                            "h-8 text-sm font-mono w-full",
                            isCritical && "border-red-400 bg-red-50 text-red-800 font-bold focus-visible:border-red-500 focus-visible:ring-red-500/30",
                            !isCritical && isAbnormal && "border-amber-300 bg-amber-50 text-amber-800 font-semibold focus-visible:border-amber-500 focus-visible:ring-amber-500/30",
                          )}
                          aria-label={`Value for ${param.name}`}
                        />
                      </div>

                      {/* Unit */}
                      <span className="hidden sm:block text-xs text-muted-foreground">{param.unit}</span>

                      {/* Reference Range */}
                      <div className="flex items-center gap-2 sm:block">
                        <Label className="sm:hidden text-xs text-muted-foreground w-16 shrink-0">Ref</Label>
                        <span className="text-xs font-mono text-muted-foreground">{param.refDisplay}</span>
                      </div>

                      {/* Status */}
                      <StatusBadge status={status} />

                      {/* Trend */}
                      <div className="hidden sm:flex items-center justify-center">
                        <TrendIcon status={status} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* ─── Technician Notes ──────────────────────────────── */}
          <Card className="gap-0 py-0">
            <CardHeader className="px-5 py-3 border-b border-border">
              <CardTitle className="text-xs font-semibold">Technician Notes</CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-3">
              <textarea
                className="w-full min-h-[72px] rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-y focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50"
                placeholder="Add notes about the sample, test conditions, or any observations..."
                value={technicianNotes}
                onChange={(e) => setTechnicianNotes(e.target.value)}
                disabled={finalized}
                aria-label="Technician notes"
              />
            </CardContent>
          </Card>

          {/* ─── Actions ──────────────────────────────────────── */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {savedDraft && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                  <CheckCircle2 className="size-3.5" />
                  Draft saved successfully
                </div>
              )}
              {finalized && (
                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <FileCheck2 className="size-4" />
                  Report Finalized &amp; Verified
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={resetToOriginal}
                disabled={finalized}
              >
                <RotateCcw className="size-3.5" />
                Reset Values
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={finalized}
              >
                <Printer className="size-3.5" />
                Print
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleSaveDraft}
                disabled={finalized}
              >
                <Save className="size-3.5" />
                Save Draft
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setFinalizeDialogOpen(true)}
                disabled={finalized}
              >
                <FileCheck2 className="size-3.5" />
                Finalize Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Finalize Confirmation Dialog ──────────────────────── */}
      <Dialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileCheck2 className="size-5 text-primary" />
              Finalize Lab Report
            </DialogTitle>
            <DialogDescription>
              Once finalized, the report will be locked and sent to the treating physician. Values cannot be edited afterwards.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
              <span className="text-sm text-foreground font-medium">Test Panel</span>
              <span className="text-sm text-foreground">{selectedPanel.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
              <span className="text-sm text-foreground font-medium">Parameters</span>
              <span className="text-sm text-foreground">{summary.total} total</span>
            </div>
            {summary.critical > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertTriangle className="size-4 text-red-600 shrink-0" />
                <span className="text-sm text-red-700 font-medium">
                  {summary.critical} critical value{summary.critical !== 1 ? "s" : ""} will trigger an immediate physician notification.
                </span>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Verified By</Label>
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2">
                <div className="flex items-center justify-center size-7 rounded-full bg-primary/10">
                  <User2 className="size-3.5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Sunita Rao, MLT</span>
                  <span className="text-[10px] text-muted-foreground">Reg. No: MLT/KA/2019/4829</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setFinalizeDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleFinalize}>
              <FileCheck2 className="size-3.5" />
              Confirm &amp; Finalize
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
