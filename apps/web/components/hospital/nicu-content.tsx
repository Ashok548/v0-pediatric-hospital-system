"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Baby, HeartPulse, AlertTriangle, CheckCircle2, Search, RefreshCw,
  ArrowRight, Stethoscope, Clock, Activity, Thermometer, Droplets, Wind,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NicuBabyCard } from "./nicu-baby-card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useNicuAdmissions, useAdmissionVitals, useRecordVitals } from "@/lib/api/nicu"
import { deriveNicuStatus, getVitalLevel } from "@/lib/utils/vitals"
import type { ApiNicuAdmission, CreateVitalsPayload } from "@/lib/types/nicu"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type FilterOption = "all" | "stable" | "warning" | "critical"

// ─── Summary stat card ────────────────────────────────────────────────────────
function SummaryCard({ label, value, icon: Icon, iconClass, bgClass, active, onClick }: {
  label: string; value: number; icon: React.ElementType; iconClass: string
  bgClass: string; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left",
      active ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/20"
    )}>
      <div className={cn("flex items-center justify-center size-10 rounded-lg shrink-0", bgClass)}>
        <Icon className={cn("size-5", iconClass)} />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-foreground leading-tight tabular-nums">{value}</span>
        <span className="text-[11px] text-muted-foreground leading-tight">{label}</span>
      </div>
    </button>
  )
}

// ─── Vitals Recording Form ────────────────────────────────────────────────────
function VitalsForm({ admissionId, onSuccess }: { admissionId: string; onSuccess: () => void }) {
  const recordVitals = useRecordVitals()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Partial<CreateVitalsPayload>>({})

  function setField(key: keyof CreateVitalsPayload, raw: string) {
    const num = raw === "" ? undefined : Number(raw)
    setForm(prev => ({ ...prev, [key]: num }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: CreateVitalsPayload = {}
    if (form.heartRate != null) payload.heartRate = form.heartRate
    if (form.spo2 != null) payload.spo2 = form.spo2
    if (form.temperature != null) payload.temperature = form.temperature
    if (form.respiratoryRate != null) payload.respiratoryRate = form.respiratoryRate
    if (form.bloodPressureSystolic != null) payload.bloodPressureSystolic = form.bloodPressureSystolic
    if (form.bloodPressureDiastolic != null) payload.bloodPressureDiastolic = form.bloodPressureDiastolic
    if (form.weight != null) payload.weight = form.weight

    if (Object.keys(payload).length === 0) {
      toast.error("Enter at least one vitals value")
      return
    }
    setLoading(true)
    try {
      await recordVitals(admissionId, payload)
      toast.success("Vitals recorded successfully")
      setForm({})
      onSuccess()
    } catch {
      toast.error("Failed to record vitals")
    } finally {
      setLoading(false)
    }
  }

  const inputCls = "h-9 text-sm"
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><HeartPulse className="size-3.5" />Heart Rate (bpm)</label>
          <Input className={inputCls} type="number" placeholder="e.g. 145" value={form.heartRate ?? ""} onChange={e => setField("heartRate", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Droplets className="size-3.5" />SpO₂ (%)</label>
          <Input className={inputCls} type="number" placeholder="e.g. 96" value={form.spo2 ?? ""} onChange={e => setField("spo2", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Thermometer className="size-3.5" />Temperature (°C)</label>
          <Input className={inputCls} type="number" step="0.1" placeholder="e.g. 36.8" value={form.temperature ?? ""} onChange={e => setField("temperature", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Wind className="size-3.5" />Resp. Rate (/min)</label>
          <Input className={inputCls} type="number" placeholder="e.g. 42" value={form.respiratoryRate ?? ""} onChange={e => setField("respiratoryRate", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">BP Systolic</label>
          <Input className={inputCls} type="number" placeholder="e.g. 90" value={form.bloodPressureSystolic ?? ""} onChange={e => setField("bloodPressureSystolic", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">BP Diastolic</label>
          <Input className={inputCls} type="number" placeholder="e.g. 60" value={form.bloodPressureDiastolic ?? ""} onChange={e => setField("bloodPressureDiastolic", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Weight (kg)</label>
          <Input className={inputCls} type="number" step="0.001" placeholder="e.g. 1.820" value={form.weight ?? ""} onChange={e => setField("weight", e.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={loading} className="w-full gap-2">
        <Activity className="size-4" />
        {loading ? "Saving…" : "Record Vitals"}
      </Button>
    </form>
  )
}

// ─── Baby Detail Sheet (with vitals history + recording form) ─────────────────
function BabyDetailSheet({ admission, onClose }: { admission: ApiNicuAdmission; onClose: () => void }) {
  const router = useRouter()
  const { vitals, isLoading: vitalsLoading, mutate: mutateVitals } = useAdmissionVitals(admission.id)
  const [activeTab, setActiveTab] = useState<"details" | "vitals" | "record">("details")
  const status = deriveNicuStatus(admission.vitalsRecords?.[0] ?? null, admission.nicuRiskLevel)
  const statusColor = { stable: "text-success bg-success/10 border-success/20", warning: "text-warning-foreground bg-warning/10 border-warning/30", critical: "text-destructive bg-destructive/10 border-destructive/30" }
  const los = Math.max(0, Math.floor((Date.now() - new Date(admission.admissionDate).getTime()) / 86_400_000))

  return (
    <div className="flex flex-col gap-4 p-1">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn("text-xs font-semibold px-3 py-1 rounded-full capitalize", statusColor[status])}>
          ● {status}
        </Badge>
        <span className="text-xs text-muted-foreground">Day <span className="font-bold text-foreground">{los}</span> in NICU</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {(["details", "vitals", "record"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("flex-1 text-xs py-1.5 rounded-md font-medium capitalize transition-all",
              activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
            {tab === "record" ? "Record Vitals" : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Details tab */}
      {activeTab === "details" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["Admission #", admission.admissionNumber],
              ["Department", admission.department],
              ["Gestational Age", admission.gestationalAge ?? "—"],
              ["Risk Level", admission.nicuRiskLevel ?? "—"],
              ["Admitted", new Date(admission.admissionDate).toLocaleDateString()],
              ["Attending", admission.admittingDoctor ? `Dr. ${admission.admittingDoctor.name}` : "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-0.5 rounded-lg bg-muted/40 border border-border p-2.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
                <span className="font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <Button className="gap-2 w-full" variant="outline" onClick={() => router.push(`/admissions/${admission.id}/transfer`)}>
              <ArrowRight className="size-4" />
              Transfer to General Ward
            </Button>
          </div>
        </div>
      )}

      {/* Vitals history tab */}
      {activeTab === "vitals" && (
        <div className="flex flex-col gap-2">
          {vitalsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : vitals.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2">
              <Activity className="size-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No vitals recorded yet</p>
            </div>
          ) : vitals.map(v => {
            const ts = deriveNicuStatus(v, null)
            return (
              <div key={v.id} className="rounded-lg border border-border bg-card p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="size-3" />{new Date(v.recordedAt).toLocaleString()}</span>
                  <Badge variant="outline" className={cn("text-[10px]", statusColor[ts])}>● {ts}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {v.heartRate != null && <span className={cn("px-2 py-0.5 rounded-md", getVitalLevel("heartRate", v.heartRate) === "critical" ? "bg-destructive/10 text-destructive" : getVitalLevel("heartRate", v.heartRate) === "warning" ? "bg-warning/10 text-warning-foreground" : "bg-muted")}>HR: {v.heartRate}</span>}
                  {v.spo2 != null && <span className={cn("px-2 py-0.5 rounded-md", getVitalLevel("spo2", v.spo2) === "critical" ? "bg-destructive/10 text-destructive" : getVitalLevel("spo2", v.spo2) === "warning" ? "bg-warning/10 text-warning-foreground" : "bg-muted")}>SpO₂: {v.spo2}%</span>}
                  {v.temperature != null && <span className={cn("px-2 py-0.5 rounded-md", getVitalLevel("temperature", Number(v.temperature)) !== "normal" ? "bg-warning/10 text-warning-foreground" : "bg-muted")}>T: {Number(v.temperature).toFixed(1)}°C</span>}
                  {v.respiratoryRate != null && <span className="px-2 py-0.5 rounded-md bg-muted">RR: {v.respiratoryRate}</span>}
                  {v.weight != null && <span className="px-2 py-0.5 rounded-md bg-muted">Wt: {v.weight} kg</span>}
                </div>
                {v.notes && <p className="text-[11px] text-muted-foreground italic">{v.notes}</p>}
              </div>
            )
          })}
        </div>
      )}

      {/* Record tab */}
      {activeTab === "record" && (
        <VitalsForm admissionId={admission.id} onSuccess={() => { mutateVitals(); setActiveTab("vitals") }} />
      )}

      <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
    </div>
  )
}

// ─── Main NicuContent ─────────────────────────────────────────────────────────
export function NicuContent() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterOption>("all")
  const [selectedAdmission, setSelectedAdmission] = useState<ApiNicuAdmission | null>(null)
  const { admissions, isLoading, mutate } = useNicuAdmissions(search || undefined)

  // Derive status for each admission and apply filter
  const withStatus = admissions.map(adm => ({
    adm,
    status: deriveNicuStatus(adm.vitalsRecords?.[0] ?? null, adm.nicuRiskLevel),
  }))
  const counts = { critical: 0, warning: 0, stable: 0 }
  withStatus.forEach(({ status }) => counts[status]++)

  const filtered = filter === "all" ? withStatus : withStatus.filter(({ status }) => status === filter)

  return (
    <>
      <TooltipProvider>
        <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">NICU Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isLoading ? "Loading patients…" : `${admissions.length} babies in NICU care`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input className="pl-8 h-8 text-xs w-48" placeholder="Search patient…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => mutate()}>
                <RefreshCw className="size-3.5" />Refresh
              </Button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total Patients" value={admissions.length} icon={Baby} iconClass="text-primary" bgClass="bg-primary/10" active={filter === "all"} onClick={() => setFilter("all")} />
            <SummaryCard label="Critical" value={counts.critical} icon={AlertTriangle} iconClass="text-destructive" bgClass="bg-destructive/10" active={filter === "critical"} onClick={() => setFilter("critical")} />
            <SummaryCard label="Needs Attention" value={counts.warning} icon={HeartPulse} iconClass="text-warning-foreground" bgClass="bg-warning/10" active={filter === "warning"} onClick={() => setFilter("warning")} />
            <SummaryCard label="Stable" value={counts.stable} icon={CheckCircle2} iconClass="text-success" bgClass="bg-success/10" active={filter === "stable"} onClick={() => setFilter("stable")} />
          </div>

          {/* Baby grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Baby className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {filter === "all" ? "No NICU patients found" : `No ${filter} patients`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(({ adm }) => (
                <NicuBabyCard key={adm.id} admission={adm} onViewDetails={() => setSelectedAdmission(adm)} />
              ))}
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* Detail Sheet */}
      <Sheet open={!!selectedAdmission} onOpenChange={open => !open && setSelectedAdmission(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border mb-5">
            <SheetTitle className="flex items-center gap-2">
              <Baby className="size-5 text-primary" />
              {selectedAdmission && `${selectedAdmission.patient.firstName} ${selectedAdmission.patient.lastName}`}
            </SheetTitle>
            <SheetDescription>
              {selectedAdmission?.gestationalAge ?? "NICU Patient"} · {selectedAdmission?.currentBed?.bedNumber ?? "—"}
            </SheetDescription>
          </SheetHeader>
          {selectedAdmission && (
            <BabyDetailSheet admission={selectedAdmission} onClose={() => setSelectedAdmission(null)} />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
