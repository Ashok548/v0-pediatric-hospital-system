"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, Loader2, XCircle, AlertCircle } from "lucide-react"
import type { ApptStatus } from "@carenest/shared-types"
import { cn } from "@/lib/utils"
import { useAppointments } from "@/lib/api/appointments"
import { useMemo } from "react"

const statusConfig: Record<ApptStatus, { className: string; icon: React.ElementType }> = {
  Scheduled: { className: "bg-[#e8f4fd] text-[#1a6fb5] border-[#bcddf5]", icon: Clock },
  "In Progress": { className: "bg-[#fff8e1] text-[#e65100] border-[#ffcc80]", icon: Loader2 },
  Completed: { className: "bg-[#e6f6ee] text-[#1a7a4c] border-[#b4e4cb]", icon: CheckCircle2 },
  Cancelled: { className: "bg-[#fde8e8] text-[#c53030] border-[#f5bcbc]", icon: XCircle },
  "No Show": { className: "bg-[#f5f5f5] text-[#616161] border-[#e0e0e0]", icon: AlertCircle },
}

const ORDER: ApptStatus[] = ["In Progress", "Scheduled", "Completed", "Cancelled", "No Show"]

export function UpcomingAppointments() {
  const todayISO = useMemo(() => new Date().toISOString(), [])
  const { appointments, isLoading } = useAppointments({ date: todayISO })

  const todayAppts = useMemo(() => {
    return [...appointments]
      .sort((a, b) => {
        const orderA = ORDER.indexOf(a.status)
        const orderB = ORDER.indexOf(b.status)
        if (orderA !== orderB) return orderA - orderB
        return a.time.localeCompare(b.time)
      })
      .slice(0, 5)
  }, [appointments])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{"Today's Appointments"}</CardTitle>
        <CardAction>
          <Link href="/appointments">
            <Button variant="ghost" size="sm" className="text-xs text-primary">
              View all
            </Button>
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Loading appointments...</p>
          </div>
        ) : todayAppts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Clock className="size-5 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">No appointments today</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {todayAppts.map((appt) => {
              const sc = statusConfig[appt.status]
              const Icon = sc.icon
              return (
                <div key={appt.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center min-w-14 py-1 px-2 rounded-md bg-primary/5">
                    <Clock className="size-3.5 text-primary mb-0.5" />
                    <span className="text-xs font-semibold text-primary font-mono">{appt.time}</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-foreground truncate">{appt.patientName}</span>
                    <span className="text-xs text-muted-foreground">
                      {appt.age} &middot; {appt.doctor?.replace("Dr. ", "Dr ")} &middot; {appt.type}
                    </span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0 gap-1 font-semibold px-2 py-0.5 rounded-full", sc.className)}>
                    <Icon className="size-3" />
                    {appt.status === "In Progress" ? "In Prog." : appt.status}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
