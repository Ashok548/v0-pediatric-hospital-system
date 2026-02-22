import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  HeartPulse,
  Thermometer,
  Droplets,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

const alerts = [
  {
    id: 1,
    severity: "critical",
    title: "NICU Bed 12 - SpO2 Drop",
    patient: "Arjun Gupta (P-1847)",
    message: "Oxygen saturation dropped below 88%. Immediate attention required.",
    time: "2 min ago",
    icon: HeartPulse,
  },
  {
    id: 2,
    severity: "critical",
    title: "PICU Bed 5 - High Temperature",
    patient: "Kabir Singh (P-1843)",
    message: "Temperature recorded at 104.2 F. Fever protocol initiated.",
    time: "8 min ago",
    icon: Thermometer,
  },
  {
    id: 3,
    severity: "warning",
    title: "Blood Bank - Low Platelet Stock",
    patient: "Inventory Alert",
    message: "Platelet concentrate stock below minimum threshold (4 units remaining).",
    time: "25 min ago",
    icon: Droplets,
  },
  {
    id: 4,
    severity: "warning",
    title: "Lab - Pending Critical Report",
    patient: "Meera Iyer (P-1846)",
    message: "CSF culture report overdue by 2 hours. Escalation triggered.",
    time: "1 hr ago",
    icon: Clock,
  },
]

export function CriticalAlerts() {
  const criticalCount = alerts.filter((a) => a.severity === "critical").length

  return (
    <Card className="border-destructive/30 bg-destructive/[0.02]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-destructive/10">
            <AlertTriangle className="size-4 text-destructive" />
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-base">Critical Alerts</CardTitle>
            <span className="text-xs text-muted-foreground">
              {criticalCount} critical, {alerts.length - criticalCount} warnings
            </span>
          </div>
        </div>
        <CardAction>
          <Badge variant="destructive" className="text-[10px] animate-pulse">
            LIVE
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => {
            const AlertIcon = alert.icon
            const isCritical = alert.severity === "critical"

            return (
              <div
                key={alert.id}
                className={cn(
                  "flex gap-3 rounded-lg border p-3 transition-colors",
                  isCritical
                    ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                    : "border-warning/30 bg-warning/5 hover:bg-warning/10"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center size-9 rounded-lg shrink-0 mt-0.5",
                    isCritical ? "bg-destructive/15" : "bg-warning/15"
                  )}
                >
                  <AlertIcon
                    className={cn(
                      "size-4",
                      isCritical ? "text-destructive" : "text-warning-foreground"
                    )}
                  />
                </div>
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground leading-tight">
                      {alert.title}
                    </span>
                    <Badge
                      variant={isCritical ? "destructive" : "outline"}
                      className="text-[9px] shrink-0 uppercase tracking-wider"
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{alert.patient}</span>
                  <p className="text-xs text-foreground/70 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{alert.time}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "text-[10px] h-6 px-2",
                        isCritical
                          ? "text-destructive hover:text-destructive"
                          : "text-primary hover:text-primary"
                      )}
                    >
                      Acknowledge
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
