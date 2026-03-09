import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, HeartPulse, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useCriticalAlerts, acknowledgeAlert } from "@/lib/api/nicu"
import { toast } from "sonner"

export function CriticalAlerts() {
  const { alerts, isLoading, mutate } = useCriticalAlerts()
  const [ackId, setAckId] = useState<string | null>(null)

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length

  async function handleAcknowledge(vitalsId: string) {
    setAckId(vitalsId)
    try {
      await acknowledgeAlert(vitalsId)
      toast.success("Alert acknowledged")
      mutate()
    } catch {
      toast.error("Failed to acknowledge alert")
    } finally {
      setAckId(null)
    }
  }

  return (
    <Card className="border-destructive/30 bg-destructive/[0.02]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-8 rounded-lg bg-destructive/10">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-destructive" />
            ) : (
              <AlertTriangle className="size-4 text-destructive" />
            )}
          </div>
          <div className="flex flex-col">
            <CardTitle className="text-base">Critical Alerts</CardTitle>
            <span className="text-xs text-muted-foreground">
              {isLoading ? "Checking monitors..." : `${criticalCount} critical, ${alerts.length - criticalCount} warnings`}
            </span>
          </div>
        </div>
        <CardAction>
          <Badge variant={isLoading ? "outline" : "destructive"} className={cn("text-[10px]", !isLoading && "animate-pulse")}>
            LIVE
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 && !isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="size-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
              <Check className="size-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-700">All Clear</p>
            <p className="text-xs text-muted-foreground">No critical vital signs detected.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {alerts.map((alert) => {
              const isCritical = alert.severity === "CRITICAL"

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
                    <HeartPulse
                      className={cn(
                        "size-4",
                        isCritical ? "text-destructive" : "text-warning-foreground"
                      )}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground leading-tight">
                        {alert.currentBed ? `${alert.currentBed.ward.name} Bed ${alert.currentBed.bedNumber}` : 'NICU Bed'}
                      </span>
                      <Badge
                        variant={isCritical ? "destructive" : "outline"}
                        className="text-[9px] shrink-0 uppercase tracking-wider"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {alert.patient.firstName} {alert.patient.lastName} ({alert.patient.uhid})
                    </span>
                    <p className="text-xs font-medium text-foreground/80 leading-relaxed mt-1">
                      {alert.alertMessage}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.recordedAt), { addSuffix: true })}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={ackId === alert.vitalsId}
                        onClick={() => handleAcknowledge(alert.vitalsId)}
                        className={cn(
                          "text-[10px] h-6 px-2",
                          isCritical
                            ? "text-destructive hover:text-destructive"
                            : "text-primary hover:text-primary"
                        )}
                      >
                        {ackId === alert.vitalsId ? <Loader2 className="size-3 animate-spin" /> : "Acknowledge"}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
