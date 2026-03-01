"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  HeartPulse,
  Droplets,
  Thermometer,
  AlertTriangle,
  Eye,
  Baby,
} from "lucide-react"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

export type BabyStatus = "stable" | "warning" | "critical"

export interface BabyVitals {
  heartRate: number
  spo2: number
  temperature: number
}

export interface NicuBaby {
  id: string
  name: string
  bed: string
  gestationalAge: string
  weight: string
  status: BabyStatus
  vitals: BabyVitals
  alerts: string[]
  admittedDate: string
  doctor: string
}

const statusConfig: Record<
  BabyStatus,
  {
    label: string
    dotClass: string
    borderClass: string
    bgClass: string
    badgeClass: string
    ringColor: string
  }
> = {
  stable: {
    label: "Stable",
    dotClass: "bg-success",
    borderClass: "border-success/30",
    bgClass: "hover:bg-success/[0.02]",
    badgeClass: "bg-success/10 text-success border-success/20",
    ringColor: "text-success",
  },
  warning: {
    label: "Warning",
    dotClass: "bg-warning",
    borderClass: "border-warning/40",
    bgClass: "bg-warning/[0.02] hover:bg-warning/[0.04]",
    badgeClass: "bg-warning/10 text-warning-foreground border-warning/30",
    ringColor: "text-warning",
  },
  critical: {
    label: "Critical",
    dotClass: "bg-destructive",
    borderClass: "border-destructive/40",
    bgClass: "bg-destructive/[0.02] hover:bg-destructive/[0.04]",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
    ringColor: "text-destructive",
  },
}

function isAbnormal(
  type: "heartRate" | "spo2" | "temperature",
  value: number
): "normal" | "warning" | "critical" {
  switch (type) {
    case "heartRate":
      if (value < 100 || value > 180) return "critical"
      if (value < 110 || value > 170) return "warning"
      return "normal"
    case "spo2":
      if (value < 88) return "critical"
      if (value < 92) return "warning"
      return "normal"
    case "temperature":
      if (value < 36.0 || value > 38.0) return "critical"
      if (value < 36.3 || value > 37.5) return "warning"
      return "normal"
  }
}

function VitalIndicator({
  icon: Icon,
  label,
  value,
  unit,
  level,
}: {
  icon: React.ElementType
  label: string
  value: string
  unit: string
  level: "normal" | "warning" | "critical"
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg px-3 py-2.5 transition-colors",
            level === "normal" && "bg-muted/60",
            level === "warning" && "bg-warning/10",
            level === "critical" && "bg-destructive/10"
          )}
        >
          <Icon
            className={cn(
              "size-3.5",
              level === "normal" && "text-muted-foreground",
              level === "warning" && "text-warning-foreground",
              level === "critical" && "text-destructive"
            )}
          />
          <span
            className={cn(
              "text-base font-bold leading-none tabular-nums",
              level === "normal" && "text-foreground",
              level === "warning" && "text-warning-foreground",
              level === "critical" && "text-destructive"
            )}
          >
            {value}
          </span>
          <span className="text-[10px] text-muted-foreground leading-none">
            {unit}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        <span>
          {label}: {value} {unit}
          {level !== "normal" && (
            <span className="font-semibold">
              {" "}
              ({level === "critical" ? "CRITICAL" : "WARNING"})
            </span>
          )}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}

function PulseIndicator({ status }: { status: BabyStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className="relative flex size-2.5">
      {status !== "stable" && (
        <span
          className={cn(
            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
            cfg.dotClass
          )}
        />
      )}
      <span
        className={cn("relative inline-flex rounded-full size-2.5", cfg.dotClass)}
      />
    </span>
  )
}

function daysInNicu(admittedDate: string): number {
  const diff = Date.now() - new Date(admittedDate).getTime()
  return Math.max(0, Math.floor(diff / 86400000))
}

interface NicuBabyCardProps {
  baby: NicuBaby
  onViewDetails?: () => void
}

export function NicuBabyCard({ baby, onViewDetails }: NicuBabyCardProps) {
  const cfg = statusConfig[baby.status]
  const hrLevel = isAbnormal("heartRate", baby.vitals.heartRate)
  const spo2Level = isAbnormal("spo2", baby.vitals.spo2)
  const tempLevel = isAbnormal("temperature", baby.vitals.temperature)
  const los = daysInNicu(baby.admittedDate)

  return (
    <Card
      className={cn(
        "py-0 gap-0 overflow-hidden transition-all duration-200",
        cfg.borderClass,
        cfg.bgClass
      )}
    >
      {/* Card header strip */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "flex items-center justify-center size-8 rounded-lg shrink-0",
              baby.status === "stable" && "bg-success/10",
              baby.status === "warning" && "bg-warning/10",
              baby.status === "critical" && "bg-destructive/10"
            )}
          >
            <Baby
              className={cn(
                "size-4",
                baby.status === "stable" && "text-success",
                baby.status === "warning" && "text-warning-foreground",
                baby.status === "critical" && "text-destructive"
              )}
            />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-foreground truncate leading-tight">
              {baby.name}
            </span>
            <span className="text-[11px] text-muted-foreground leading-tight">
              Bed {baby.bed} &middot; Day {los} &middot; {baby.weight}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <PulseIndicator status={baby.status} />
          <Badge
            variant="outline"
            className={cn("text-[10px] font-semibold uppercase tracking-wider", cfg.badgeClass)}
          >
            {cfg.label}
          </Badge>
        </div>
      </div>

      <CardContent className="px-4 py-3 flex flex-col gap-3">
        {/* Gestational age */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Gestational Age</span>
          <span className="font-medium text-foreground">{baby.gestationalAge}</span>
        </div>

        {/* Vitals row */}
        <div className="grid grid-cols-3 gap-2">
          <VitalIndicator
            icon={HeartPulse}
            label="Heart Rate"
            value={String(baby.vitals.heartRate)}
            unit="bpm"
            level={hrLevel}
          />
          <VitalIndicator
            icon={Droplets}
            label="SpO2"
            value={String(baby.vitals.spo2)}
            unit="%"
            level={spo2Level}
          />
          <VitalIndicator
            icon={Thermometer}
            label="Temp"
            value={baby.vitals.temperature.toFixed(1)}
            unit={"\u00B0C"}
            level={tempLevel}
          />
        </div>

        {/* Alert badges */}
        {baby.alerts.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {baby.alerts.map((alert) => (
              <Badge
                key={alert}
                variant="outline"
                className={cn(
                  "text-[10px] gap-1",
                  baby.status === "critical"
                    ? "border-destructive/30 text-destructive bg-destructive/5"
                    : "border-warning/30 text-warning-foreground bg-warning/5"
                )}
              >
                <AlertTriangle className="size-2.5" />
                {alert}
              </Badge>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <span className="text-[10px] text-muted-foreground">
            Dr. {baby.doctor}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2.5 text-primary hover:text-primary gap-1.5"
            onClick={onViewDetails}
          >
            <Eye className="size-3" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
