"use client"

import { useState, useMemo, useEffect } from "react"
import {
  ArrowLeft,
  Baby,
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
  CircleDot,
  RotateCcw,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { useLabOrder, updateLabPanelResults, finalizeLabOrder } from "@/lib/api/labs"
import { ApiError } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { getLabOrderStatusLabel, isTerminalLabOrderStatus } from "@/lib/utils/lab-order-status"
import { appendTranscript } from "@/lib/utils/transcript"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

// ─── Mock Patient removed in favor of order.patient ──────────────

// ─── Test Panels ────────────────────────────────────────────────
type StatusType = "normal" | "low" | "high" | "critical-low" | "critical-high" | "pending"
type LabPanelStatus = "PENDING" | "SAMPLE_COLLECTED" | "SAMPLE_REJECTED" | "PROCESSING" | "COMPLETED" | "VERIFIED"

interface LabPanelReadiness {
  panelId: string
  panelName: string
  status: LabPanelStatus
  statusLabel: string
  missingCount: number
  totalCount: number
  isDirty: boolean
  isBackendReady: boolean
  canAutoSave: boolean
  blocker: string | null
}

interface ParameterRow {
  id: string
  name: string
  value: string
  unit: string
  refMin: number | null
  refMax: number | null
  criticalMin: number | null
  criticalMax: number | null
  refDisplay: string
}

interface TestPanel {
  id: string
  name: string
  category: string
  sampleType: string
  collectedAt: string
  receivedAt: string
  status: LabPanelStatus
  parameters: ParameterRow[]
}

// ─── Test Panels Mock Data removed in favor of API ──────────────

// ─── Helpers ────────────────────────────────────────────────────
function getStatus(val: string, param: ParameterRow): StatusType {
  if (!val || val.trim() === "") return "pending"
  const num = parseFloat(val)
  if (isNaN(num)) return "pending"

  if (param.criticalMin !== null && num < param.criticalMin) return "critical-low"
  if (param.criticalMax !== null && num > param.criticalMax) return "critical-high"
  if (param.refMin !== null && num < param.refMin) return "low"
  if (param.refMax !== null && num > param.refMax) return "high"

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

function getPanelStatusLabel(status: LabPanelStatus): string {
  switch (status) {
    case "PENDING":
      return "Awaiting Sample"
    case "SAMPLE_COLLECTED":
      return "Sample Collected"
    case "SAMPLE_REJECTED":
      return "Sample Rejected"
    case "PROCESSING":
      return "Processing"
    case "COMPLETED":
      return "Completed"
    case "VERIFIED":
      return "Verified"
  }
}

function isPanelReadyForFinalize(status: LabPanelStatus): boolean {
  return status === "COMPLETED" || status === "VERIFIED"
}

function getPanelStatusBadgeClasses(status: LabPanelStatus): string {
  switch (status) {
    case "VERIFIED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "COMPLETED":
      return "bg-sky-50 text-sky-700 border-sky-200"
    case "SAMPLE_REJECTED":
      return "bg-red-50 text-red-700 border-red-200"
    default:
      return "bg-amber-50 text-amber-700 border-amber-200"
  }
}

function getPanelIndicatorClasses(readiness: LabPanelReadiness): string {
  if (readiness.blocker && readiness.missingCount > 0) {
    return "bg-red-500"
  }
  if (readiness.blocker) {
    return "bg-amber-500"
  }
  if (readiness.isDirty) {
    return "bg-sky-500"
  }
  return "bg-emerald-500"
}

// ─── Component ──────────────────────────────────────────────────
export function LabResultsContent({ orderId }: { orderId?: string } = {}) {
  const { user } = useAuth()
  const { order, isLoading, mutate } = useLabOrder(orderId ?? null)
  const { toast } = useToast()

  const [isSaving, setIsSaving] = useState(false)
  const [isFinalizing, setIsFinalizing] = useState(false)

  const testPanels: TestPanel[] = useMemo(() => {
    if (!order) return []
    return order.panels.map((p: any) => ({
      id: p.id,
      name: p.panelName,
      category: p.category,
      sampleType: p.sampleType,
      collectedAt: p.collectedAt ? new Date(p.collectedAt).toLocaleString() : "Pending",
      receivedAt: p.receivedAt ? new Date(p.receivedAt).toLocaleString() : "Pending",
      status: p.status,
      parameters: p.items.map((i: any) => ({
        id: i.id || i.parameterName,
        name: i.parameterName,
        value: i.value || "",
        unit: i.unit,
        refMin: i.refMin,
        refMax: i.refMax,
        criticalMin: i.criticalMin,
        criticalMax: i.criticalMax,
        refDisplay: i.refDisplay
      }))
    }))
  }, [order])

  const [selectedPanelId, setSelectedPanelId] = useState<string>("")
  const [panelValues, setPanelValues] = useState<Record<string, Record<string, string>>>({})
  const [savedDraft, setSavedDraft] = useState(false)
  const isLocked = isTerminalLabOrderStatus(order?.status)
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)
  const [technicianNotes, setTechnicianNotes] = useState("")

  useEffect(() => {
    if (testPanels.length > 0) {
      if (!selectedPanelId) setSelectedPanelId(testPanels[0].id)
      if (Object.keys(panelValues).length === 0) {
        const initial: Record<string, Record<string, string>> = {}
        testPanels.forEach((panel) => {
          initial[panel.id] = {}
          panel.parameters.forEach((p) => {
            initial[panel.id][p.id] = p.value
          })
        })
        setPanelValues(initial)
      }
    }
  }, [testPanels])

  const selectedPanel = testPanels.find((p) => p.id === selectedPanelId) || testPanels[0]

  const panelReadiness = useMemo<LabPanelReadiness[]>(() => {
    return testPanels.map((panel) => {
      const values = panelValues[panel.id] || {}
      const missingCount = panel.parameters.filter((parameter) => !(values[parameter.id] ?? "").trim()).length
      const isDirty = panel.parameters.some((parameter) => (values[parameter.id] ?? "") !== parameter.value)
      const isBackendReady = isPanelReadyForFinalize(panel.status)
      const canAutoSave = isDirty && missingCount === 0

      let blocker: string | null = null
      if (isDirty && missingCount > 0) {
        blocker = `${missingCount} result${missingCount === 1 ? "" : "s"} still missing`
      } else if (!isBackendReady && !canAutoSave) {
        blocker = `Panel status is ${getPanelStatusLabel(panel.status)}`
      }

      return {
        panelId: panel.id,
        panelName: panel.name,
        status: panel.status,
        statusLabel: getPanelStatusLabel(panel.status),
        missingCount,
        totalCount: panel.parameters.length,
        isDirty,
        isBackendReady,
        canAutoSave,
        blocker,
      }
    })
  }, [panelValues, testPanels])

  const selectedPanelReadiness = panelReadiness.find((panel) => panel.panelId === selectedPanelId) ?? null
  const verificationBlockers = panelReadiness.filter((panel) => panel.blocker)

  const updateValue = (parameterId: string, value: string) => {
    setPanelValues((prev) => ({
      ...prev,
      [selectedPanelId]: {
        ...prev[selectedPanelId],
        [parameterId]: value,
      },
    }))
    setSavedDraft(false)
  }

  // (Early return moved below to follow Rules of Hooks)

  const patient = order?.patient || {
    uhid: "—",
    firstName: "Unknown",
    lastName: "Patient",
    dob: "—",
    age: "—",
    gender: "—",
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
  }

  // Compute summary counts
  const summary = useMemo(() => {
    const values = panelValues[selectedPanelId] || {}
    let normal = 0
    let abnormal = 0
    let critical = 0
    let pending = 0
    selectedPanel?.parameters.forEach((p) => {
      const val = values[p.id] ?? ""
      const status = getStatus(val, p)
      if (status === "normal") normal++
      else if (status === "critical-low" || status === "critical-high") critical++
      else if (status === "low" || status === "high") abnormal++
      else pending++
    })
    return { normal, abnormal, critical, pending, total: selectedPanel?.parameters.length || 0 }
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

  const getPanelPayload = (panel: TestPanel) => ({
    items: panel.parameters.map((parameter) => ({
      id: parameter.id,
      parameterName: parameter.name,
      value: panelValues[panel.id]?.[parameter.id] || "",
      unit: parameter.unit,
      refDisplay: parameter.refDisplay,
      refMin: parameter.refMin !== null ? parameter.refMin : undefined,
      refMax: parameter.refMax !== null ? parameter.refMax : undefined,
      criticalMin: parameter.criticalMin !== null ? parameter.criticalMin : undefined,
      criticalMax: parameter.criticalMax !== null ? parameter.criticalMax : undefined,
    })),
  })

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof ApiError) return error.message
    if (error instanceof Error && error.message) return error.message
    return fallback
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground animate-pulse">Loading lab order details...</div>
      </div>
    )
  }

  const handleSaveDraft = async () => {
    if (!orderId || !selectedPanelId) return
    if (!selectedPanel || !selectedPanelReadiness) return

    if (selectedPanelReadiness.missingCount > 0) {
      toast({
        title: "Panel incomplete",
        description: `Enter all ${selectedPanelReadiness.totalCount} results before saving ${selectedPanel.name}.`,
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)

    try {
      await updateLabPanelResults(selectedPanelId, getPanelPayload(selectedPanel))
      await mutate() // Refresh order state from backend

      setSavedDraft(true)
      toast({
        title: "Draft Saved",
        description: "Your results have been saved to the database successfully."
      })
    } catch (error) {
      toast({
        title: "Error saving draft",
        description: getApiErrorMessage(error, "Unable to save this panel."),
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinalize = async () => {
    if (!orderId || !order) return
    setIsFinalizing(true)

    try {
      const incompleteDirtyPanels = panelReadiness.filter((panel) => panel.isDirty && panel.missingCount > 0)
      if (incompleteDirtyPanels.length > 0) {
        const firstBlockedPanel = incompleteDirtyPanels[0]
        toast({
          title: "Complete pending results first",
          description: `${firstBlockedPanel.panelName}: ${firstBlockedPanel.blocker}`,
          variant: "destructive"
        })
        return
      }

      const dirtyPanelsToSave = testPanels.filter((panel) => {
        const readiness = panelReadiness.find((item) => item.panelId === panel.id)
        return readiness?.canAutoSave
      })

      for (const panel of dirtyPanelsToSave) {
        await updateLabPanelResults(panel.id, getPanelPayload(panel))
      }

      await mutate()

      const remainingBlockers = panelReadiness.filter((panel) => {
        if (panel.isDirty && panel.missingCount === 0) {
          return false
        }
        return Boolean(panel.blocker)
      })

      if (remainingBlockers.length > 0) {
        const firstBlockedPanel = remainingBlockers[0]
        toast({
          title: "Verification blocked",
          description: `${firstBlockedPanel.panelName}: ${firstBlockedPanel.blocker}`,
          variant: "destructive"
        })
        return
      }

      await finalizeLabOrder(orderId)
      await mutate()

      setFinalizeDialogOpen(false)
      setSavedDraft(false)

      toast({
        title: "Report Verified",
        description: "The order is locked and report generated.",
        className: "bg-emerald-50 text-emerald-900 border-emerald-200"
      })
    } catch (error) {
      toast({
        title: "Error finalizing report",
        description: getApiErrorMessage(error, "Unable to verify the report."),
        variant: "destructive"
      })
    } finally {
      setIsFinalizing(false)
    }
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
                    {patient.firstName} {patient.lastName}
                  </h1>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {patient.uhid}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <User2 className="size-3" />
                    Patient Profile
                  </span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="flex items-center gap-1" title={order?.admissionId || ''}>
                    {order?.patientType === "INPATIENT" ? "🏥" : "🩺"} 
                    {order?.patientType === "INPATIENT" ? `Inpatient Admission` : `Outpatient Visit`}
                  </span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="size-3" />
                    {order?.doctor?.name || "Dr. Priya Reddy"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/50 px-4 py-2.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lab Order</span>
                <span className="text-sm font-bold text-foreground mt-0.5">{order?.orderNumber || "—"}</span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="size-2.5" />
                  {order?.orderDate ? new Date(order.orderDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
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
              const readiness = panelReadiness.find((item) => item.panelId === panel.id)
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
                  <div className="min-w-0 flex-1">
                    <span className="block truncate">{panel.name.split("(")[0].trim()}</span>
                    {readiness && (
                      <span className="block text-[10px] font-medium text-muted-foreground">
                        {readiness.statusLabel}
                        {readiness.missingCount > 0 ? ` · ${readiness.missingCount} pending` : " · Ready"}
                        {readiness.isDirty ? " · Unsaved" : ""}
                      </span>
                    )}
                  </div>
                  {panelHasCritical && <span className="size-2.5 rounded-full bg-red-500 shrink-0 animate-pulse" />}
                  {!panelHasCritical && panelHasAbnormal && <span className="size-2.5 rounded-full bg-amber-500 shrink-0" />}
                  {!panelHasCritical && !panelHasAbnormal && readiness && <span className={cn("size-2.5 rounded-full shrink-0", getPanelIndicatorClasses(readiness))} />}
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
                  {selectedPanelReadiness && (
                    <Badge variant="secondary" className={cn("text-[10px] font-medium border", getPanelStatusBadgeClasses(selectedPanelReadiness.status))}>
                      {selectedPanelReadiness.statusLabel}
                    </Badge>
                  )}
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
                          id={`param-input-${param.id}`}
                          type="text"
                          value={currentValue}
                          onChange={(e) => updateValue(param.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                              e.preventDefault();
                              const form = e.currentTarget.form;
                              if (!form) {
                                // Fallback to manual DOM query since we don't have a form wrapper
                                const inputs = Array.from(document.querySelectorAll('input[id^="param-input-"]')) as HTMLInputElement[];
                                const idx = inputs.indexOf(e.currentTarget);
                                if (idx > -1 && idx < inputs.length - 1) {
                                  inputs[idx + 1].focus();
                                }
                              }
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const inputs = Array.from(document.querySelectorAll('input[id^="param-input-"]')) as HTMLInputElement[];
                              const idx = inputs.indexOf(e.currentTarget);
                              if (idx > 0) {
                                inputs[idx - 1].focus();
                              }
                            }
                          }}
                          disabled={isLocked || isSaving || isFinalizing}
                          className={cn(
                            "h-8 text-sm font-mono w-full transition-all",
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
                disabled={isLocked}
                aria-label="Technician notes"
              />
              <VoiceRecorder
                disabled={isLocked || isSaving || isFinalizing}
                onTextGenerated={(text) => setTechnicianNotes((prev) => appendTranscript(prev, text))}
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
              {verificationBlockers.length > 0 && !isLocked && (
                <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  <AlertTriangle className="size-4" />
                  {verificationBlockers.length} panel{verificationBlockers.length === 1 ? "" : "s"} still block verification
                </div>
              )}
              {order?.status === 'VERIFIED' && (
                <div className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  <FileCheck2 className="size-4" />
                  Report {getLabOrderStatusLabel(order.status)} by {order.verifiedBy?.name || "Lab Technician"}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={resetToOriginal}
                disabled={isLocked}
              >
                <RotateCcw className="size-3.5" />
                Reset Values
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                disabled={isLocked}
              >
                <Printer className="size-3.5" />
                Print
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleSaveDraft}
                disabled={isLocked || isSaving || isFinalizing}
              >
                {isSaving ? <RotateCcw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setFinalizeDialogOpen(true)}
                disabled={isLocked}
              >
                <FileCheck2 className="size-3.5" />
                Verify Report
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
              Verify Lab Report
            </DialogTitle>
            <DialogDescription>
              Once verified, the report will be locked and sent to the treating physician. Values cannot be edited afterwards.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
              <span className="text-sm text-foreground font-medium">Panels</span>
              <span className="text-sm text-foreground">{testPanels.length} total</span>
            </div>
            {allPanelsSummary.totalCritical > 0 && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                <AlertTriangle className="size-4 text-red-600 shrink-0" />
                <span className="text-sm text-red-700 font-medium">
                  {allPanelsSummary.totalCritical} critical value{allPanelsSummary.totalCritical !== 1 ? "s" : ""} will trigger an immediate physician notification.
                </span>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {panelReadiness.map((panel) => (
                <div key={panel.panelId} className="rounded-lg border border-border bg-muted/40 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{panel.panelName}</p>
                      <p className="text-xs text-muted-foreground">
                        {panel.totalCount - panel.missingCount}/{panel.totalCount} results entered
                        {panel.isDirty ? " · Unsaved changes" : ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className={cn("text-[10px] font-medium border", getPanelStatusBadgeClasses(panel.status))}>
                      {panel.statusLabel}
                    </Badge>
                  </div>
                  {panel.blocker ? (
                    <p className="mt-2 text-xs font-medium text-amber-700">{panel.blocker}</p>
                  ) : panel.canAutoSave ? (
                    <p className="mt-2 text-xs font-medium text-sky-700">Ready to save during verification</p>
                  ) : (
                    <p className="mt-2 text-xs font-medium text-emerald-700">Ready for verification</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold">Verified By</Label>
              <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border px-3 py-2">
                <div className="flex items-center justify-center size-7 rounded-full bg-primary/10">
                  <User2 className="size-3.5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{user?.name || "Computing..."}</span>
                  <span className="text-[10px] text-muted-foreground">{user?.role?.name || "Staff Member"}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setFinalizeDialogOpen(false)} disabled={isFinalizing}>
              Cancel
            </Button>
            <Button size="sm" className="gap-1.5" onClick={handleFinalize} disabled={isFinalizing}>
              <FileCheck2 className="size-3.5" />
              {isFinalizing ? "Verifying..." : "Confirm & Verify"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
