"use client"

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Baby, HeartPulse, AlertTriangle, CheckCircle2, Search, RefreshCw,
  ArrowRight, Clock, Activity, Thermometer, Droplets, Wind, Plus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NicuBabyCard } from "./nicu-baby-card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useNicuAdmissions, useAdmissionVitals, useRecordVitals } from "@/lib/api/nicu"
import { deriveNicuStatus, getVitalLevel } from "@/lib/utils/vitals"
import type { ApiNicuAdmission, CreateVitalsPayload } from "@/lib/types/nicu"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { usePrecriptions } from "@/lib/api/pharmacy" // (assuming used elsewhere if needed, else delete soon)
import { NicuBabyDetailModal } from "./nicu-baby-detail-modal"

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

// (Old components removed, now using NicuBabyDetailModal)
// ─── Main NicuContent ─────────────────────────────────────────────────────────
export function NicuContent() {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterOption>("all")
  const [selectedAdmission, setSelectedAdmission] = useState<ApiNicuAdmission | null>(null)
  const [quickOrder, setQuickOrder] = useState<{ type: 'lab'|'med'|'service', adm: ApiNicuAdmission, key: number } | null>(null)
  const { admissions, isLoading, mutate } = useNicuAdmissions(search || undefined)

  const triggerQuickOrder = (type: 'lab'|'med'|'service', adm: ApiNicuAdmission) => {
    setQuickOrder(null)
    setTimeout(() => setQuickOrder({ type, adm, key: Date.now() }), 10)
  }

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
                <NicuBabyCard 
                  key={adm.id} 
                  admission={adm} 
                  onViewDetails={() => setSelectedAdmission(adm)} 
                  onOrderLab={() => triggerQuickOrder('lab', adm)}
                  onOrderMedication={() => triggerQuickOrder('med', adm)}
                  onOrderService={() => triggerQuickOrder('service', adm)}
                />
              ))}
            </div>
          )}
        </div>
      </TooltipProvider>

      {/* Patient Detail Modal */}
      <Dialog open={!!selectedAdmission} onOpenChange={open => !open && setSelectedAdmission(null)}>
        <DialogContent className="max-w-4xl lg:max-w-5xl h-[95vh] flex flex-col p-0 overflow-hidden shrink-0 border-0 shadow-2xl">
          {/* We dropped the standard DialogHeader so that our custom rich header fits completely border-to-border */}
          <DialogTitle className="sr-only">NICU Patient Overlay</DialogTitle> 
          <DialogDescription className="sr-only">Detailed health record and workflow modal for NICU babies.</DialogDescription>
          {selectedAdmission && (
            <NicuBabyDetailModal admission={selectedAdmission} onClose={() => setSelectedAdmission(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Order Dialogs (mounted dynamically when triggered) */}
      {quickOrder && <QuickOrderWrapper key={quickOrder.key} quickOrder={quickOrder} />}
    </>
  )
}

function QuickOrderWrapper({ quickOrder }: { quickOrder: { type: 'lab'|'med'|'service', adm: ApiNicuAdmission } }) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    // delay tick to ensure trigger is mounted before clicking
    setTimeout(() => ref.current?.click(), 10)
  }, [])

  const trigger = <button ref={ref} className="hidden" aria-hidden="true" />

  return (
    <div>
      {quickOrder.type === 'lab' && (
        <CreateLabOrderDialog 
          patientId={quickOrder.adm.patient.id} 
          admissionId={quickOrder.adm.id} 
          trigger={trigger}
        />
      )}
      {quickOrder.type === 'med' && (
        <CreateMedicationOrderDialog 
          patientId={quickOrder.adm.patient.id} 
          admissionId={quickOrder.adm.id} 
          trigger={trigger}
        />
      )}
      {quickOrder.type === 'service' && (
        <CreateServiceOrderDialog 
          patientId={quickOrder.adm.patient.id} 
          admissionId={quickOrder.adm.id} 
          trigger={trigger}
        />
      )}
    </div>
  )
}
