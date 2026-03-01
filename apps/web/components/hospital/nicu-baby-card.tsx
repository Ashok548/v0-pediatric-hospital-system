"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HeartPulse, Droplets, Thermometer, AlertTriangle, Eye, Baby, Wind } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { getVitalLevel, deriveNicuStatus, type NicuStatus } from "@/lib/utils/vitals"
import type { ApiNicuAdmission } from "@/lib/types/nicu"

const statusConfig: Record<NicuStatus, {
  label: string; dotClass: string; borderClass: string; bgClass: string; badgeClass: string
}> = {
  stable: {
    label: "Stable",
    dotClass: "bg-success",
    borderClass: "border-success/30",
    bgClass: "hover:bg-success/[0.02]",
    badgeClass: "bg-success/10 text-success border-success/20",
  },
  warning: {
    label: "Warning",
    dotClass: "bg-warning",
    borderClass: "border-warning/40",
    bgClass: "bg-warning/[0.02] hover:bg-warning/[0.04]",
    badgeClass: "bg-warning/10 text-warning-foreground border-warning/30",
  },
  critical: {
    label: "Critical",
    dotClass: "bg-destructive",
    borderClass: "border-destructive/40",
    bgClass: "bg-destructive/[0.02] hover:bg-destructive/[0.04]",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
  },
}

function PulseIndicator({ status }: { status: NicuStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className="relative flex size-2.5">
      {status !== "stable" && (
        <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", cfg.dotClass)} />
      )}
      <span className={cn("relative inline-flex rounded-full size-2.5", cfg.dotClass)} />
    </span>
  )
}

function VitalChip({ icon: Icon, value, unit, level }: {
  icon: React.ElementType; value: string; unit: string; level: "normal" | "warning" | "critical"
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "flex flex-col items-center gap-1 rounded-lg px-3 py-2.5 transition-colors",
          level === "normal" && "bg-muted/60",
          level === "warning" && "bg-warning/10",
          level === "critical" && "bg-destructive/10"
        )}>
          <Icon className={cn("size-3.5",
            level === "normal" && "text-muted-foreground",
            level === "warning" && "text-warning-foreground",
            level === "critical" && "text-destructive"
          )} />
          <span className={cn("text-base font-bold leading-none tabular-nums",
            level === "normal" && "text-foreground",
            level === "warning" && "text-warning-foreground",
            level === "critical" && "text-destructive"
          )}>{value}</span>
          <span className="text-[10px] text-muted-foreground leading-none">{unit}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">{value} {unit}{level !== "normal" && ` (${level.toUpperCase()})`}</TooltipContent>
    </Tooltip>
  )
}

function daysInNicu(admissionDate: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(admissionDate).getTime()) / 86_400_000))
}

interface NicuBabyCardProps {
  admission: ApiNicuAdmission
  onViewDetails?: () => void
}

export function NicuBabyCard({ admission, onViewDetails }: NicuBabyCardProps) {
  const latestVitals = admission.vitalsRecords?.[0] ?? null
  const status = deriveNicuStatus(latestVitals, admission.nicuRiskLevel)
  const cfg = statusConfig[status]
  const los = daysInNicu(admission.admissionDate)
  const patientName = `${admission.patient.firstName} ${admission.patient.lastName}`
  const bedLabel = admission.currentBed?.bedNumber ?? "—"

  return (
    <Card className={cn("py-0 gap-0 overflow-hidden transition-all duration-200", cfg.borderClass, cfg.bgClass)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={cn("flex items-center justify-center size-8 rounded-lg shrink-0",
            status === "stable" && "bg-success/10",
            status === "warning" && "bg-warning/10",
            status === "critical" && "bg-destructive/10"
          )}>
            <Baby className={cn("size-4",
              status === "stable" && "text-success",
              status === "warning" && "text-warning-foreground",
              status === "critical" && "text-destructive"
            )} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate leading-tight">{patientName}</span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Bed {bedLabel} · Day {los} · ADM-{admission.admissionNumber}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PulseIndicator status={status} />
          <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase tracking-wider", cfg.badgeClass)}>
            {cfg.label}
          </Badge>
        </div>
      </div>

      <CardContent className="px-4 py-3 flex flex-col gap-3">
        {/* Gestational age + risk level */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Gestational Age</span>
          <span className="font-medium text-foreground">{admission.gestationalAge ?? "—"}</span>
        </div>

        {/* Vitals */}
        {latestVitals ? (
          <div className="grid grid-cols-4 gap-2">
            {latestVitals.heartRate != null && (
              <VitalChip icon={HeartPulse} value={String(latestVitals.heartRate)} unit="bpm" level={getVitalLevel("heartRate", latestVitals.heartRate)} />
            )}
            {latestVitals.spo2 != null && (
              <VitalChip icon={Droplets} value={String(latestVitals.spo2)} unit="%" level={getVitalLevel("spo2", latestVitals.spo2)} />
            )}
            {latestVitals.temperature != null && (
              <VitalChip icon={Thermometer} value={Number(latestVitals.temperature).toFixed(1)} unit="°C" level={getVitalLevel("temperature", Number(latestVitals.temperature))} />
            )}
            {latestVitals.respiratoryRate != null && (
              <VitalChip icon={Wind} value={String(latestVitals.respiratoryRate)} unit="/min" level={getVitalLevel("respiratoryRate", latestVitals.respiratoryRate)} />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2">
            <AlertTriangle className="size-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">No vitals recorded yet</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <span className="text-[10px] text-muted-foreground">
            {admission.admittingDoctor ? `Dr. ${admission.admittingDoctor.name}` : "—"}
          </span>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2.5 text-primary hover:text-primary gap-1.5" onClick={onViewDetails}>
            <Eye className="size-3" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
