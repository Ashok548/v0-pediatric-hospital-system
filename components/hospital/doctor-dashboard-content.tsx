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

// ── Data ──────────────────────────────────────────────────────────────

const doctorProfile = {
  name: "Dr. Priya Reddy",
  speciality: "Consultant Pediatrician",
  department: "General Pediatrics",
  mci: "MCI-78432",
}

const todaysAppointments = [
  { id: "A-001", time: "09:00", patient: "Aarav Mehta", age: "4y", type: "Follow-up", status: "completed", complaint: "Post-discharge review (pneumonia)" },
  { id: "A-002", time: "09:30", patient: "Diya Kapoor", age: "8m", type: "New", status: "completed", complaint: "Recurrent wheezing" },
  { id: "A-003", time: "10:00", patient: "Vihaan Sharma", age: "2y", type: "Urgent", status: "in-progress", complaint: "High fever since 3 days" },
  { id: "A-004", time: "10:30", patient: "Ananya Iyer", age: "6y", type: "Follow-up", status: "waiting", complaint: "Epilepsy medication review" },
  { id: "A-005", time: "11:00", patient: "Rohan Das", age: "10y", type: "New", status: "waiting", complaint: "Recurrent abdominal pain" },
  { id: "A-006", time: "11:30", patient: "Saanvi Nair", age: "3y", type: "Vaccination", status: "waiting", complaint: "DPT Booster + OPV" },
  { id: "A-007", time: "14:00", patient: "Kabir Singh", age: "5y", type: "Follow-up", status: "scheduled", complaint: "Asthma action plan review" },
  { id: "A-008", time: "14:30", patient: "Myra Gupta", age: "1y", type: "New", status: "scheduled", complaint: "Developmental milestone concern" },
  { id: "A-009", time: "15:00", patient: "Aditya Patel", age: "7y", type: "Urgent", status: "scheduled", complaint: "Persistent cough with blood-tinged sputum" },
  { id: "A-010", time: "15:30", patient: "Ishaan Joshi", age: "11y", type: "Follow-up", status: "scheduled", complaint: "Type 1 Diabetes - HbA1c review" },
]

const pendingDischarges = [
  { id: "DS-001", patient: "Arjun Gupta", age: "3y", uhid: "P-1847", ward: "Pediatric Ward A", bed: "A-12", diagnosis: "Acute Bronchopneumonia", admitted: "Feb 14", los: 8, status: "draft" },
  { id: "DS-002", patient: "Meera Iyer", age: "6y", uhid: "P-1846", ward: "PICU", bed: "PICU-5", diagnosis: "Dengue Hemorrhagic Fever", admitted: "Feb 18", los: 4, status: "review" },
  { id: "DS-003", patient: "Riya Verma", age: "9m", uhid: "P-1852", ward: "Pediatric Ward B", bed: "B-08", diagnosis: "Acute Gastroenteritis with Dehydration", admitted: "Feb 20", los: 2, status: "pending-sign" },
]

const nicuAlerts = [
  { id: "NC-1", severity: "critical" as const, baby: "Baby of Priya (B-1901)", bed: "NICU-12", gestAge: "28 wks", message: "SpO2 dropped to 84%. Ventilator settings adjusted.", time: "3 min ago", icon: HeartPulse, vital: "SpO2: 84%" },
  { id: "NC-2", severity: "critical" as const, baby: "Baby of Kavitha (B-1903)", bed: "NICU-07", gestAge: "30 wks", message: "Apnea episode detected. Stimulation given.", time: "12 min ago", icon: Baby, vital: "Apnea Event" },
  { id: "NC-3", severity: "warning" as const, baby: "Baby of Sneha (B-1905)", bed: "NICU-15", gestAge: "32 wks", message: "Temperature trending low at 36.1 C. Warming initiated.", time: "20 min ago", icon: Thermometer, vital: "Temp: 36.1 C" },
]

const calendarDays = (() => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: { day: number; isToday: boolean; hasAppointments: boolean; appointmentCount: number }[] = []

  for (let i = 0; i < firstDay; i++) {
    days.push({ day: 0, isToday: false, hasAppointments: false, appointmentCount: 0 })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate()
    const apptCount = isToday ? 10 : Math.floor(Math.random() * 8)
    days.push({ day: d, isToday, hasAppointments: apptCount > 0, appointmentCount: apptCount })
  }
  return days
})()

const monthName = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })

const searchPatients = [
  { uhid: "P-1847", name: "Arjun Gupta", age: "3y", gender: "M", ward: "Ward A, Bed A-12" },
  { uhid: "P-1846", name: "Meera Iyer", age: "6y", gender: "F", ward: "PICU, Bed 5" },
  { uhid: "P-1852", name: "Riya Verma", age: "9m", gender: "F", ward: "Ward B, Bed B-08" },
  { uhid: "P-1855", name: "Aarav Mehta", age: "4y", gender: "M", ward: "OPD" },
  { uhid: "P-1901", name: "Baby of Priya", age: "12d", gender: "M", ward: "NICU, Bed 12" },
  { uhid: "P-1903", name: "Baby of Kavitha", age: "8d", gender: "F", ward: "NICU, Bed 7" },
]

// ── Helpers ───────────────────────────────────────────────────────────

function getStatusColor(status: string) {
  switch (status) {
    case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "in-progress": return "bg-blue-50 text-blue-700 border-blue-200"
    case "waiting": return "bg-amber-50 text-amber-700 border-amber-200"
    case "scheduled": return "bg-slate-50 text-slate-600 border-slate-200"
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

// ── Component ─────────────────────────────────────────────────────────

export function DoctorDashboardContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFocused, setSearchFocused] = useState(false)

  const now = new Date()
  const currentHour = now.getHours()
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening"
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  const completedCount = todaysAppointments.filter(a => a.status === "completed").length
  const inProgressCount = todaysAppointments.filter(a => a.status === "in-progress").length
  const waitingCount = todaysAppointments.filter(a => a.status === "waiting").length

  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return searchPatients.filter(
      p => p.name.toLowerCase().includes(q) || p.uhid.toLowerCase().includes(q)
    )
  }, [searchQuery])

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
                      key={p.uhid}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted cursor-pointer transition-colors border-b border-border last:border-0"
                      role="option"
                      aria-selected={false}
                    >
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {p.name.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {p.uhid} &middot; {p.age} &middot; {p.gender} &middot; {p.ward}
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
              <span className="text-2xl font-bold text-foreground leading-none">{nicuAlerts.filter(a => a.severity === "critical").length}</span>
              <span className="text-xs text-muted-foreground mt-0.5">NICU Critical</span>
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
            <CardHeader>
              <div className="flex flex-col gap-0.5">
                <CardTitle className="text-base">{"Today's Appointments"}</CardTitle>
                <CardDescription>
                  {completedCount} completed &middot; {inProgressCount} in progress &middot; {waitingCount} waiting
                </CardDescription>
              </div>
              <CardAction>
                <Button variant="outline" size="sm" className="text-xs gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Full Schedule
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {todaysAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                      appt.status === "in-progress" && "border-primary/30 bg-primary/[0.03]"
                    )}
                  >
                    {/* Time */}
                    <div className="flex flex-col items-center shrink-0 w-14">
                      <span className={cn(
                        "text-sm font-semibold",
                        appt.status === "in-progress" ? "text-primary" : "text-foreground"
                      )}>
                        {appt.time}
                      </span>
                      {appt.status === "in-progress" && (
                        <span className="flex items-center gap-1 text-[10px] text-primary font-medium mt-0.5">
                          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                          NOW
                        </span>
                      )}
                    </div>

                    {/* Divider */}
                    <div className={cn(
                      "w-px h-10 shrink-0",
                      appt.status === "in-progress" ? "bg-primary/30" : "bg-border"
                    )} />

                    {/* Patient Info */}
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{appt.patient}</span>
                        <span className="text-xs text-muted-foreground">{appt.age}</span>
                        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", getTypeColor(appt.type))}>
                          {appt.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{appt.complaint}</p>
                    </div>

                    {/* Status + Action */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 hidden sm:inline-flex border", getStatusColor(appt.status))}>
                        {appt.status === "in-progress" ? "In Progress" : appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                      </Badge>
                      {appt.status === "in-progress" ? (
                        <Button size="sm" className="text-xs h-7 gap-1">
                          Continue
                          <ArrowRight className="size-3" />
                        </Button>
                      ) : appt.status === "waiting" ? (
                        <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                          Start
                        </Button>
                      ) : appt.status === "completed" ? (
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
                {pendingDischarges.map((ds) => (
                  <div key={ds.id} className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Avatar className="size-10 mt-0.5 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {ds.patient.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{ds.patient}</span>
                          <span className="text-xs text-muted-foreground">{ds.age} &middot; {ds.uhid}</span>
                        </div>
                        <p className="text-xs text-foreground/80">{ds.diagnosis}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span>{ds.ward} &middot; Bed {ds.bed}</span>
                          <span>Admitted {ds.admitted}</span>
                          <span>LOS: {ds.los} days</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <Badge variant="outline" className={cn("text-[10px] border", getDischargeStatusColor(ds.status))}>
                        {getDischargeStatusLabel(ds.status)}
                      </Badge>
                      <Button variant="outline" size="sm" className="text-xs h-7 gap-1">
                        <ClipboardList className="size-3" />
                        {ds.status === "pending-sign" ? "Sign" : ds.status === "review" ? "Review" : "Edit"}
                      </Button>
                    </div>
                  </div>
                ))}
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
                    {nicuAlerts.filter(a => a.severity === "critical").length} critical, {nicuAlerts.filter(a => a.severity === "warning").length} warning
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
                {nicuAlerts.map((alert) => {
                  const AlertIcon = alert.icon
                  const isCritical = alert.severity === "critical"
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
                        <AlertIcon className={cn("size-4", isCritical ? "text-destructive" : "text-amber-600")} />
                      </div>
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground leading-tight">{alert.baby}</span>
                          <Badge
                            variant={isCritical ? "destructive" : "outline"}
                            className={cn("text-[9px] shrink-0 uppercase tracking-wider", !isCritical && "border-amber-300 text-amber-700 bg-amber-50")}
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{alert.bed} &middot; {alert.gestAge}</span>
                        <div className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded w-fit mt-0.5",
                          isCritical ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-700"
                        )}>
                          <HeartPulse className="size-3" />
                          {alert.vital}
                        </div>
                        <p className="text-xs text-foreground/70 leading-relaxed mt-0.5">{alert.message}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-muted-foreground">{alert.time}</span>
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
                  <Button variant="ghost" size="icon-sm" className="size-7" aria-label="Previous month">
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="size-7" aria-label="Next month">
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <span className="text-sm font-semibold text-foreground text-center">{monthName}</span>

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
                      className={cn(
                        "relative flex flex-col items-center justify-center aspect-square rounded-lg text-xs transition-colors",
                        day.day === 0 && "invisible",
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
                {[
                  { label: "Inpatients Under Care", value: "14", sub: "3 wards" },
                  { label: "Lab Reports to Review", value: "6", sub: "2 critical" },
                  { label: "Prescriptions Today", value: "22", sub: "3 pending sign" },
                  { label: "Pending Referrals", value: "2", sub: "1 urgent" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex flex-col">
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground">{item.sub}</span>
                    </div>
                    <span className="text-lg font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
