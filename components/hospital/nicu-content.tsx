"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Baby, HeartPulse, AlertTriangle, Filter, RefreshCw, Thermometer,
  Droplets, Bed, User2, Stethoscope, Clock, ArrowRight, CheckCircle2,
  Phone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NicuBabyCard, type NicuBaby, type BabyStatus } from "./nicu-baby-card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { updatePatientStatus } from "@/lib/store/patients"
import { getNicuBabies, subscribeNicu, removeNicuBaby, setNicuBabies } from "@/lib/store/nicu"
import { nicuBabies as initialBabies } from "@/lib/data/nicu"

type FilterOption = "all" | BabyStatus

const WARDS = ["Paediatric General Ward", "PICU", "Surgical Ward", "Day Care"]

// ─── LOS helper ──────────────────────────────────────────────────────────────
function daysInNicu(admittedDate: string): number {
  const diff = Date.now() - new Date(admittedDate).getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

// ─── Summary stat card ───────────────────────────────────────────────────────
function SummaryCard({ label, value, icon: Icon, iconClass, bgClass, active, onClick }: {
  label: string; value: number; icon: React.ElementType; iconClass: string
  bgClass: string; active: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      className={cn("flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left",
        active ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card hover:border-primary/20")}>
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

// ─── Baby Detail Sheet ────────────────────────────────────────────────────────
function BabyDetailSheet({ baby, onClose, onTransfer }: {
  baby: NicuBaby; onClose: () => void; onTransfer: () => void
}) {
  const los = daysInNicu(baby.admittedDate)
  const vitals = [
    { label: "Heart Rate", value: baby.vitals.heartRate, unit: "bpm", icon: HeartPulse },
    { label: "SpO₂", value: baby.vitals.spo2, unit: "%", icon: Droplets },
    { label: "Temperature", value: baby.vitals.temperature.toFixed(1), unit: "°C", icon: Thermometer },
  ]
  const statusColor: Record<BabyStatus, string> = {
    stable: "text-[#1a7a4c] bg-[#e6f6ee] border-[#b4e4cb]",
    warning: "text-[#b45309] bg-[#fff8e1] border-[#fcd34d]",
    critical: "text-[#c53030] bg-[#fde8e8] border-[#f5bcbc]",
  }

  return (
    <div className="flex flex-col gap-5 p-1">
      {/* Status + LOS */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn("text-xs font-semibold px-3 py-1 rounded-full capitalize", statusColor[baby.status])}>
          ● {baby.status}
        </Badge>
        <span className="text-xs text-muted-foreground">Day <span className="font-bold text-foreground">{los}</span> in NICU</span>
      </div>

      {/* Baby info */}
      <Card className="py-0">
        <CardContent className="px-4 py-4 flex items-start gap-3">
          <div className={cn("flex items-center justify-center size-12 rounded-xl shrink-0",
            baby.status === "stable" ? "bg-[#e6f6ee]" : baby.status === "warning" ? "bg-[#fff8e1]" : "bg-[#fde8e8]")}>
            <Baby className={cn("size-6", baby.status === "stable" ? "text-[#1a7a4c]" : baby.status === "warning" ? "text-[#b45309]" : "text-[#c53030]")} />
          </div>
          <div>
            <p className="font-bold text-foreground">{baby.name}</p>
            <p className="text-xs text-muted-foreground">Bed {baby.bed} · {baby.weight} · {baby.gestationalAge}</p>
            <p className="text-xs text-muted-foreground">Admitted: {baby.admittedDate}</p>
          </div>
        </CardContent>
      </Card>

      {/* Vitals */}
      <div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Live Vitals</p>
        <div className="grid grid-cols-3 gap-2">
          {vitals.map(v => (
            <div key={v.label} className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 border border-border p-2.5">
              <v.icon className="size-4 text-muted-foreground" />
              <span className="text-base font-bold tabular-nums text-foreground">{v.value}</span>
              <span className="text-[10px] text-muted-foreground">{v.unit}</span>
              <span className="text-[9px] text-muted-foreground text-center leading-tight">{v.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {baby.alerts.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">Active Alerts</p>
          <div className="flex flex-col gap-1.5">
            {baby.alerts.map(a => (
              <div key={a} className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
                <AlertTriangle className="size-3.5 text-destructive shrink-0" />
                <span className="text-xs text-destructive">{a}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor */}
      <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
        <Stethoscope className="size-4 text-muted-foreground" />
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Attending</p>
          <p className="text-sm font-medium">{baby.doctor}</p>
        </div>
      </div>

      {/* Transfer action — only for stable / warning */}
      {baby.status !== "critical" && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Transfer</p>
          <Button className="gap-2 w-full" onClick={onTransfer}>
            <ArrowRight className="size-4" />
            Transfer to General Ward
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">Only available when status is Stable or Warning</p>
        </div>
      )}

      <Button variant="outline" onClick={onClose} className="w-full mt-1">Close</Button>
    </div>
  )
}

// ─── Transfer Sheet ───────────────────────────────────────────────────────────
function TransferSheet({ baby, onClose, onConfirm }: {
  baby: NicuBaby; onClose: () => void; onConfirm: (ward: string, bed: string) => void
}) {
  const [ward, setWard] = useState("")
  const [bed, setBed] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")

  function handleConfirm() {
    if (!ward) { setError("Please select a ward"); return }
    if (!bed.trim()) { setError("Please enter a bed number"); return }
    setError("")
    onConfirm(ward, bed.trim())
  }

  const inputCls = "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all"

  return (
    <div className="flex flex-col gap-5 p-1">
      {/* Summary */}
      <Card className="py-0">
        <CardContent className="px-4 py-3 flex items-center gap-3">
          <div className="flex items-center justify-center size-9 rounded-lg bg-[#e6f6ee] shrink-0">
            <Baby className="size-4 text-[#1a7a4c]" />
          </div>
          <div>
            <p className="text-sm font-medium">{baby.name}</p>
            <p className="text-[11px] text-muted-foreground">NICU Bed {baby.bed} · Day {daysInNicu(baby.admittedDate)} · {baby.weight}</p>
          </div>
        </CardContent>
      </Card>

      {/* Ward selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider">Transfer to Ward</label>
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

      {/* Bed no. */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider">Bed Number</label>
        <div className="relative">
          <Bed className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input value={bed} onChange={e => setBed(e.target.value)} placeholder="e.g. Peds-W2 / B-03"
            className={cn(inputCls, "pl-9")} />
        </div>
      </div>

      {/* Transfer notes */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider">Transfer Notes <span className="font-normal normal-case text-muted-foreground">(optional)</span></label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          placeholder="Clinical reasons for transfer, special instructions..."
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all resize-none placeholder:text-muted-foreground" />
      </div>

      {/* Checklist */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Pre-transfer Checklist</p>
        {["Attending doctor notified", "Ward nurse informed", "Patient stable for transfer", "Transfer notes documented"].map(item => (
          <div key={item} className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-[#1a7a4c] shrink-0" />
            <span className="text-xs text-foreground">{item}</span>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <AlertTriangle className="size-3.5" />{error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1 gap-2" onClick={handleConfirm}>
          <ArrowRight className="size-4" />Confirm Transfer
        </Button>
      </div>
    </div>
  )
}

// ─── Main NicuContent ─────────────────────────────────────────────────────────
export function NicuContent() {
  const [filter, setFilter] = useState<FilterOption>("all")
  const [babies, setBabies] = useState<NicuBaby[]>(getNicuBabies())
  const [selectedBaby, setSelectedBaby] = useState<NicuBaby | null>(null)
  const [transferBaby, setTransferBaby] = useState<NicuBaby | null>(null)
  const [transferredCount, setTransferredCount] = useState(0)

  // Subscribe to NICU store changes
  React.useEffect(() => {
    return subscribeNicu(() => {
      setBabies(getNicuBabies())
    })
  }, [])

  const totalBabies = babies.length
  const criticalCount = babies.filter(b => b.status === "critical").length
  const warningCount = babies.filter(b => b.status === "warning").length
  const stableCount = babies.filter(b => b.status === "stable").length

  const filteredBabies = filter === "all" ? babies : babies.filter(b => b.status === filter)

  function handleTransferConfirm(ward: string, bed: string) {
    if (!transferBaby) return
    // Update patient status in the shared store (links to the patient list)
    updatePatientStatus(transferBaby.id, "IP", `${ward} / Bed ${bed}`)
    // Remove from local NICU list
    removeNicuBaby(transferBaby.id)
    setTransferredCount(c => c + 1)
    setTransferBaby(null)
    setSelectedBaby(null)
  }

  return (
    <>
      <TooltipProvider>
        <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1600px] mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">NICU Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalBabies} babies in care{transferredCount > 0 && ` · ${transferredCount} transferred today`}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs"
              onClick={() => setNicuBabies(initialBabies)}>
              <RefreshCw className="size-3.5" />Refresh
            </Button>
          </div>

          {/* Status filter cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Total Patients" value={totalBabies} icon={Baby}
              iconClass="text-primary" bgClass="bg-primary/10" active={filter === "all"} onClick={() => setFilter("all")} />
            <SummaryCard label="Critical" value={criticalCount} icon={AlertTriangle}
              iconClass="text-destructive" bgClass="bg-destructive/10" active={filter === "critical"} onClick={() => setFilter("critical")} />
            <SummaryCard label="Needs Attention" value={warningCount} icon={HeartPulse}
              iconClass="text-warning-foreground" bgClass="bg-warning/10" active={filter === "warning"} onClick={() => setFilter("warning")} />
            <SummaryCard label="Stable" value={stableCount} icon={CheckCircle2}
              iconClass="text-[#1a7a4c]" bgClass="bg-[#e6f6ee]" active={filter === "stable"} onClick={() => setFilter("stable")} />
          </div>

          {/* Baby grid */}
          {filteredBabies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Baby className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {filter === "all" ? "All babies have been transferred to wards" : `No ${filter} patients`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBabies.map(baby => (
                <NicuBabyCard key={baby.id} baby={baby} onViewDetails={() => setSelectedBaby(baby)} />
              ))}
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* Baby Detail Sheet */}
      <Sheet open={!!selectedBaby} onOpenChange={open => !open && setSelectedBaby(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[400px] overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border mb-5">
            <SheetTitle className="flex items-center gap-2">
              <Baby className="size-5 text-primary" />
              {selectedBaby?.name}
            </SheetTitle>
            <SheetDescription>NICU Bed {selectedBaby?.bed} · {selectedBaby?.gestationalAge}</SheetDescription>
          </SheetHeader>
          {selectedBaby && (
            <BabyDetailSheet
              baby={selectedBaby}
              onClose={() => setSelectedBaby(null)}
              onTransfer={() => { setTransferBaby(selectedBaby); setSelectedBaby(null) }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Transfer Sheet */}
      <Sheet open={!!transferBaby} onOpenChange={open => !open && setTransferBaby(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] overflow-y-auto">
          <SheetHeader className="pb-4 border-b border-border mb-5">
            <SheetTitle className="flex items-center gap-2">
              <ArrowRight className="size-5 text-primary" />
              Transfer to Ward
            </SheetTitle>
            <SheetDescription>NICU → General Ward transfer for {transferBaby?.name}</SheetDescription>
          </SheetHeader>
          {transferBaby && (
            <TransferSheet
              baby={transferBaby}
              onClose={() => setTransferBaby(null)}
              onConfirm={handleTransferConfirm}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
