"use client"

import { useState, useMemo } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAdmissions } from "@/lib/api/admissions"
import { useAppointments } from "@/lib/api/appointments"
import { useDashboardWorkload } from "@/lib/api/dashboard"
import { formatDistanceToNow } from "date-fns"
import { useAuthStore, HospitalRole } from "@/lib/store/auth-store"
import { apiClient } from "@/lib/api-client"
import useSWR from "swr"
import {
  Search,
  CalendarDays,
  Clock,
  FileText,
  AlertTriangle,
  HeartPulse,
  Thermometer,
  ChevronLeft,
  ChevronRight,
  Baby,
  User,
  ClipboardList,
  Stethoscope,
  ArrowRight,
  Eye,
  ExternalLink,
  X,
} from "lucide-react"

// ── Helpers ───────────────────────────────────────────────────────────

const monthName = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })

function getStatusColor(status: string) {
  switch (status) {
    case "Completed": return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "In Progress": return "bg-blue-50 text-blue-700 border-blue-200"
    case "Scheduled": return "bg-amber-50 text-amber-700 border-amber-200"
    default: return "bg-muted text-muted-foreground"
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case "Urgent": return "bg-red-50 text-red-700 border-red-200"
    case "New": return "bg-blue-50 text-blue-700 border-blue-200"
    case "Follow-up": return "bg-slate-50 text-slate-600 border-slate-200"
    case "Vaccination": return "bg-emerald-50 text-emerald-700 border-emerald-200"
    default: return "bg-muted text-muted-foreground"
  }
}

function getDischargeStatusColor(status: string) {
  switch (status) {
    case "draft": return "bg-slate-50 text-slate-600 border-slate-200"
    case "review": return "bg-amber-50 text-amber-700 border-amber-200"
    case "pending-sign": return "bg-blue-50 text-blue-700 border-blue-200"
    default: return "bg-muted text-muted-foreground"
  }
}

function getDischargeStatusLabel(status: string) {
  switch (status) {
    case "draft": return "Draft"
    case "review": return "Needs Review"
    case "pending-sign": return "Awaiting Signature"
    default: return status
  }
}

const fetcher = (url: string) => apiClient(url) as Promise<any>;

// ── Component ─────────────────────────────────────────────────────────

export function DoctorDashboardContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)

  // Calendar States
  const [currentDate, setCurrentDate] = useState(new Date()) // Controls month being viewed
  const [selectedDate, setSelectedDate] = useState(new Date()) // Controls daily schedule shown

  const { currentUser } = useAuthStore()

  // Dynamic role mapping for display
  const specialityMap: Record<HospitalRole, string> = {
    doctor: "Consultant Pediatrician",
    admin: "System Administrator",
    nurse: "Head Nurse",
    billing_clerk: "Billing Officer",
    pharmacist: "Chief Pharmacist",
  }

  const doctorProfile = currentUser ? {
    name: currentUser.name,
    speciality: specialityMap[currentUser.role as HospitalRole] || "Staff",
    department: currentUser.department,
  } : {
    name: "Dr. Unknown",
    speciality: "Staff",
    department: "Hospital",
  }

  // Fetch real admission data
  const { admissions = [] } = useAdmissions({ status: "ADMITTED" })

  // Fetch live appointments for the specifically selected date
  const selectedDateISO = useMemo(() => {
    const d = new Date(selectedDate)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset()) // robust local iso date
    return d.toISOString().split('T')[0]
  }, [selectedDate])

  const { appointments = [], isLoading: apptsLoading } = useAppointments({ date: selectedDateISO })

  // Fetch Calendar monthly data
  const viewMonthISO = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    return `${y}-${m}`;
  }, [currentDate]);

  const { data: calendarData } = useSWR(currentUser?.id ? `/appointments/calendar?month=${viewMonthISO}&doctorId=${currentUser.id}` : `/appointments/calendar?month=${viewMonthISO}`, fetcher)

  // Fetch workload data
  const { workload, isLoading: workloadLoading } = useDashboardWorkload()

  const pendingDischarges = admissions.filter(a => a.dischargeStatus === "IN_PROGRESS" || a.dischargeStatus === "PENDING")

  // Fetch Live NICU Alerts
  const { data: activeNicuAlerts = [] } = useSWR(`/nicu/alerts`, fetcher, { refreshInterval: 15000 })

  const now = new Date()
  const currentHour = now.getHours()
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening"
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  const todaysAppointments = appointments || [];
  const completedCount = todaysAppointments.filter((a: any) => a.status === "Completed").length
  const inProgressCount = todaysAppointments.filter((a: any) => a.status === "In Progress").length
  const waitingCount = todaysAppointments.filter((a: any) => a.status === "Scheduled").length

  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return admissions.filter(
      p => `${p.patient.firstName} ${p.patient.lastName}`.toLowerCase().includes(q) || p.patient.uhid.toLowerCase().includes(q)
    )
  }, [searchQuery, admissions])

  // Generate dynamic calendar grid mapped to live data
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const today = new Date()
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

    const days: { day: number; isToday: boolean; isSelected: boolean; hasAppointments: boolean; appointmentCount: number }[] = []

    // Pad starting empty days
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, isToday: false, isSelected: false, hasAppointments: false, appointmentCount: 0 })
    }

    // Fill active days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = isCurrentMonth && d === today.getDate()
      const isSelected = selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === d

      const apptCount = calendarData?.days?.[d] || 0

      days.push({ day: d, isToday, isSelected, hasAppointments: apptCount > 0, appointmentCount: apptCount })
    }
    return days
  }, [currentDate, selectedDate, calendarData])

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ── Greeting Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
            {greeting}, {doctorProfile.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {dateStr} &middot; {doctorProfile.speciality} &middot; {doctorProfile.department}
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full lg:w-96">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder="Quick search by patient name or UHID..."
              className="pl-9 pr-9 h-10 bg-card"
              aria-label="Search patients"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              {filteredSearch.length > 0 ? (
                <ul role="listbox" aria-label="Search results">
                  {filteredSearch.map((p) => (
                    <li
                      key={p.patient.uhid}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-0"
                      role="option"
                      aria-selected={false}
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {p.patient.firstName[0]}{p.patient.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground truncate">{p.patient.firstName} {p.patient.lastName}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.patient.uhid} &middot; {p.currentBed ? `${p.currentBed.ward.name} / ${p.currentBed.bedNumber}` : 'OPD'}
                        </span>
                      </div>
                      <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-6 text-center">
                  <Search className="size-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No patients found for &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 shrink-0">
              <CalendarDays className="size-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground leading-none">{todaysAppointments.length}</span>
              <span className="text-xs text-muted-foreground mt-0.5">{"Today's Appointments"}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-amber-500/10 shrink-0">
              <FileText className="size-5 text-amber-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground leading-none">{pendingDischarges.length}</span>
              <span className="text-xs text-muted-foreground mt-0.5">Pending Discharges</span>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-red-500/10 shrink-0">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground leading-none">{activeNicuAlerts.length}</span>
              <span className="text-xs text-muted-foreground mt-0.5">NICU Alerts</span>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-emerald-500/10 shrink-0">
              <Stethoscope className="size-5 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold text-foreground leading-none">{completedCount}</span>
              <span className="text-xs text-muted-foreground mt-0.5">Seen Today</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── Left Column: Appointments ────────────────────────────── */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex flex-col gap-0.5">
                <CardTitle className="text-base">
                  {selectedDate.toDateString() === new Date().toDateString() ? "Today's Appointments" : `${selectedDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })} Schedule`}
                </CardTitle>
                <CardDescription>
                  {completedCount} completed &middot; {inProgressCount} in progress &middot; {waitingCount} waiting
                </CardDescription>
              </div>
              <CardAction className="flex gap-2 isolate">
                <Button size="sm" className="hidden sm:inline-flex text-xs gap-1.5 shrink-0" asChild>
                  <a href="/appointments">
                    <CalendarDays className="size-3.5" />
                    New Appointment
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 shrink-0" asChild>
                  <a href="/appointments">
                    <FileText className="size-3.5" />
                    Full Schedule
                  </a>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {todaysAppointments.map((appt: any) => (
                  <div
                    key={appt.id}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                      appt.status === "In Progress" && "border-primary/30 bg-primary/[0.03]"
                    )}
                  >
                    {/* Time */}
                    <div className="flex flex-col items-center shrink-0 w-14">
                      <span className={cn(
                        "text-sm font-semibold",
                        appt.status === "In Progress" ? "text-primary" : "text-foreground"
                      )}>
                        {appt.time}
                      </span>
                      {appt.status === "In Progress" && (
                        <span className="flex items-center gap-1 text-[10px] text-primary font-medium mt-0.5">
                          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                          NOW
                        </span>
                      )}
                    </div>

                    {/* Divider */}
                    <div className={cn(
                      "w-px h-10 shrink-0",
                      appt.status === "In Progress" ? "bg-primary/30" : "bg-border"
                    )} />

                    {/* Patient Info */}
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{appt.patientName}</span>
                        <span className="text-xs text-muted-foreground">{appt.age}</span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", getTypeColor(appt.type))}>
                          {appt.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{(appt.chiefComplaint || appt.notes || "Follow-up check")}</p>
                    </div>

                    {/* Status + Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 hidden sm:inline-flex border", getStatusColor(appt.status))}>
                        {appt.status === "In Progress" ? "In Progress" : appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                      </Badge>
                      {appt.status === "In Progress" ? (
                        <Button size="sm" className="text-xs h-7 gap-1">
                          Continue
                          <ArrowRight className="size-3" />
                        </Button>
                      ) : appt.status === "Scheduled" ? (
                        <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                          Start
                        </Button>
                      ) : appt.status === "Completed" ? (
                        <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-muted-foreground">
                          <Eye className="size-3" />
                          View
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground">
                          <Clock className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Pending Discharge Summaries ──────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-amber-500/10">
                  <FileText className="size-4 text-amber-600" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base">Pending Discharge Summaries</CardTitle>
                  <CardDescription>{pendingDischarges.length} summaries require your attention</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {pendingDischarges.slice(0, 3).map((ds: any) => (
                  <div key={ds.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="size-10 mt-0.5 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {ds.patient.firstName[0]}{ds.patient.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{ds.patient.firstName} {ds.patient.lastName}</span>
                          <span className="text-xs text-muted-foreground">{ds.patient.uhid}</span>
                        </div>
                        <p className="text-xs text-foreground/80">{ds.department}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span>{ds.currentBed ? `${ds.currentBed.ward.name} / ${ds.currentBed.bedNumber}` : 'No Bed'}</span>
                          <span>Admitted {new Date(ds.admissionDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <Badge variant="outline" className="text-[10px] border">
                        Rounding
                      </Badge>
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                        <ClipboardList className="size-3" />
                        Notes
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingDischarges.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">No discharge summaries require your attention right now.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column ─────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* ── NICU Critical Alerts ────────────────────────────── */}
          <Card className="border-destructive/25 bg-destructive/[0.02]">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-destructive/10">
                  <AlertTriangle className="size-4 text-destructive" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <CardTitle className="text-base">NICU Alerts</CardTitle>
                  <CardDescription>
                    {activeNicuAlerts.length} unresolved alerts
                  </CardDescription>
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
                {activeNicuAlerts.map((alert: any) => {
                  const isCritical = alert.severity === 'CRITICAL'
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "flex gap-3 rounded-lg border p-3",
                        isCritical
                          ? "border-destructive/25 bg-destructive/5"
                          : "border-amber-300/30 bg-amber-50/50"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center size-9 rounded-lg shrink-0",
                        isCritical ? "bg-destructive/10" : "bg-amber-500/10"
                      )}>
                        <AlertTriangle className={cn("size-4", isCritical ? "text-destructive" : "text-amber-600")} />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground leading-tight">{alert.patient.firstName} {alert.patient.lastName}</span>
                          <Badge
                            variant={isCritical ? "destructive" : "outline"}
                            className={cn("text-[8px] sm:text-[9px] shrink-0 uppercase tracking-wider", !isCritical && "border-amber-300 text-amber-700 bg-amber-50")}
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{alert.currentBed?.bedNumber}</span>
                        <div className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded w-fit mt-0.5",
                          isCritical ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700"
                        )}>
                          <HeartPulse className="size-3" />
                          {alert.alertMessage}
                        </div>
                        <p className="text-xs text-foreground/70 leading-relaxed mt-0.5">Automated vital alert generated from monitor</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(alert.recordedAt), { addSuffix: true })}</span>
                          <Button variant="ghost" size="sm" className={cn(
                            "text-[10px] h-6 px-2",
                            isCritical ? "text-destructive hover:text-destructive" : "text-primary hover:text-primary"
                          )}>
                            Acknowledge
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {activeNicuAlerts.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">No NICU alerts at this time.</p>
                )}
                <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full mt-1">
                  <Baby className="size-3.5" />
                  Open NICU Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ── Calendar Schedule ───────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
                  <CalendarDays className="size-4 text-primary" />
                </div>
                <CardTitle className="text-base">Schedule</CardTitle>
              </div>
              <CardAction>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" className="size-7" onClick={prevMonth} aria-label="Previous month">
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="size-7" onClick={nextMonth} aria-label="Next month">
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-foreground text-center">
                  {currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                </span>

                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                    <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => (
                    <button
                      key={i}
                      disabled={day.day === 0}
                      onClick={() => {
                        if (day.day > 0) {
                          const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day.day)
                          setSelectedDate(d)
                        }
                      }}
                      className={cn(
                        "relative flex flex-col items-center justify-center aspect-square rounded-lg text-xs transition-colors",
                        day.day === 0 && "invisible pointer-events-none",
                        day.isSelected && !day.isToday && "ring-2 ring-primary/50 text-foreground ring-offset-1 bg-muted/50 font-bold",
                        day.isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : day.hasAppointments
                            ? "hover:bg-muted text-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted/50"
                      )}
                      aria-label={day.day > 0 ? `${day.day}, ${day.appointmentCount} appointments` : undefined}
                    >
                      {day.day > 0 && day.day}
                      {day.hasAppointments && !day.isToday && (
                        <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Today summary */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Today</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">{completedCount} done</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{inProgressCount} active</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-amber-500" />
                      <span className="text-muted-foreground">{waitingCount} waiting</span>
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── My Quick Stats ──────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
                  <User className="size-4 text-primary" />
                </div>
                <CardTitle className="text-base">My Workload</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {workloadLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <span className="text-sm text-muted-foreground animate-pulse">Loading stats...</span>
                  </div>
                ) : (
                  [
                    { label: "Inpatients Under Care", value: workload?.inpatients?.toString() || "0", sub: "Active Admits" },
                    { label: "Lab Reports to Review", value: workload?.labReports?.toString() || "0", sub: "Pending/Partial" },
                    { label: "Prescriptions Today", value: workload?.prescriptionsToday?.toString() || "0", sub: "Issued Today" },
                    { label: "Pending Referrals", value: workload?.pendingReferrals?.toString() || "0", sub: "Required Action" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                      </div>
                      <span className="text-lg font-bold text-foreground">{item.value}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
