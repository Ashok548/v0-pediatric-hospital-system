"use client"

import { useState, useMemo, useCallback } from "react"
import {
    Search, Plus, CalendarDays, Clock, CheckCircle2, XCircle,
    Loader2, ChevronLeft, ChevronRight, X, User2, Stethoscope,
    Phone, FileText, ChevronDown, AlertCircle, Eye, Syringe,
    BadgeCheck, Printer,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { VoiceRecorder } from "@/components/VoiceRecorder"
import { appendTranscript } from "@/lib/utils/transcript"
import type { Appointment, ApptStatus } from "@carenest/shared-types"
import { usePatients } from "@/lib/api/patients"
import { useAppointments, useDoctors, createAppointment, updateAppointmentStatus, useAppointmentStats, useMonthlyCalendar, useDepartments, useAppointmentTypes, rescheduleAppointment, deleteAppointment } from "@/lib/api/appointments"
import { createOPVisit } from "@/lib/api/op-visits"
import { createBill } from "@/lib/api/billing"

// ─── Config ──────────────────────────────────────────────────────────────────
const statusConfig: Record<ApptStatus, { label: string; className: string; icon: React.ElementType }> = {
    Scheduled: { label: "Scheduled", className: "bg-[#e8f4fd] text-[#1a6fb5] border-[#bcddf5]", icon: Clock },
    "In Progress": { label: "In Progress", className: "bg-[#fff8e1] text-[#e65100] border-[#ffcc80]", icon: Loader2 },
    Completed: { label: "Completed", className: "bg-[#e6f6ee] text-[#1a7a4c] border-[#b4e4cb]", icon: CheckCircle2 },
    Cancelled: { label: "Cancelled", className: "bg-[#fde8e8] text-[#c53030] border-[#f5bcbc]", icon: XCircle },
    "No Show": { label: "No Show", className: "bg-[#f5f5f5] text-[#616161] border-[#e0e0e0]", icon: AlertCircle },
}

const nextStatus: Partial<Record<ApptStatus, { label: string; next: ApptStatus; icon: React.ElementType }[]>> = {
    Scheduled: [
        { label: "Start", next: "In Progress", icon: Loader2 },
        { label: "Cancel", next: "Cancelled", icon: XCircle },
        { label: "No Show", next: "No Show", icon: AlertCircle },
    ],
    "In Progress": [
        { label: "Complete", next: "Completed", icon: CheckCircle2 },
        { label: "Cancel", next: "Cancelled", icon: XCircle },
    ],
}


const TIME_SLOTS = [
    "09:00", "09:20", "09:40", "10:00", "10:20", "10:40",
    "11:00", "11:20", "11:40", "12:00", "12:20",
    "14:00", "14:20", "14:40", "15:00", "15:20", "15:40",
    "16:00", "16:20",
]

const weekDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function getInitials(name: string) {
    const p = name.trim().split(" ")
    return p.length >= 2 ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase() : name[0].toUpperCase()
}

function fmtDate(d: Date) {
    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })
}

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

// ─── Booking Form ─────────────────────────────────────────────────────────────
interface BookingFormProps {
    selectedDate: Date
    onSubmit: (appt: Omit<Appointment, "id" | "token">) => void
    onClose: () => void
}

function BookingForm({ selectedDate, onSubmit, onClose }: BookingFormProps) {
    const [uhidQuery, setUhidQuery] = useState("")
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
    const [doctor, setDoctor] = useState("")
    const [department, setDepartment] = useState("")
    const [time, setTime] = useState("")
    const [type, setType] = useState("")
    const [notes, setNotes] = useState("")
    const [errors, setErrors] = useState<Record<string, string>>({})

    const { patients, isLoading: isLoadingPatients } = usePatients({ search: uhidQuery, limit: 5 })

    const patientMatches = useMemo(() => {
        if (uhidQuery.length < 2) return []
        return patients
    }, [uhidQuery, patients])

    const { doctors: apiDoctors } = useDoctors()
    const { departments: apiDepartments } = useDepartments()
    const { types: apiTypes } = useAppointmentTypes()
    const { appointments: todaysAppts } = useAppointments({ date: selectedDate.toISOString() })

    const takenSlots = useMemo(() =>
        todaysAppts.filter(a => a.doctorId === doctor).map(a => a.time),
        [todaysAppts, doctor]
    )

    function validate() {
        const e: Record<string, string> = {}
        if (!selectedPatient) e.patient = "Select a patient"
        if (!doctor) e.doctor = "Select a doctor"
        if (!department) e.department = "Select a department"
        if (!time) e.time = "Select a time slot"
        if (!type) e.type = "Select appointment type"
        setErrors(e)
        return Object.keys(e).length === 0
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate() || !selectedPatient) return

        const finalDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), parseInt(time.split(":")[0]), parseInt(time.split(":")[1])).toISOString()

        onSubmit({
            patientId: selectedPatient.id,
            doctorId: doctor,
            department,
            appointmentDate: finalDate,
            timeSlot: time,
            type,
            notes,
            chiefComplaint: notes
        } as any)
    }

    const inputCls = (field: string) => cn(
        "w-full h-9 px-3 rounded-lg border bg-background text-sm outline-none transition-all",
        errors[field]
            ? "border-destructive focus:ring-2 focus:ring-destructive/20"
            : "border-input focus:border-ring focus:ring-2 focus:ring-ring/20"
    )

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-1">
            {/* Patient Search */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Patient</label>
                {selectedPatient ? (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                        <div>
                            <p className="text-sm font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                            <p className="text-[11px] text-muted-foreground">{selectedPatient.uhid} · DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()} · {selectedPatient.gender === "F" ? "Female" : "Male"}</p>
                        </div>
                        <button type="button" onClick={() => { setSelectedPatient(null); setUhidQuery("") }}
                            className="text-muted-foreground hover:text-foreground">
                            <X className="size-4" />
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <input
                            value={uhidQuery} onChange={e => setUhidQuery(e.target.value)}
                            placeholder="Search by name or UHID…"
                            className={cn(inputCls("patient"), "pl-9")}
                        />
                        {patientMatches.length > 0 && (
                            <div className="absolute z-50 top-full mt-1 w-full rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
                                {patientMatches.map(p => (
                                    <button key={p.uhid} type="button"
                                        onClick={() => { setSelectedPatient(p); setUhidQuery("") }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 text-left transition-colors">
                                        <Avatar className="size-7 shrink-0">
                                            <AvatarFallback className={cn("text-[10px]", p.gender === "F" ? "bg-[#fce4ec] text-[#c2185b]" : "bg-[#e3f2fd] text-[#1565c0]")}>
                                                {getInitials(`${p.firstName} ${p.lastName}`)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                                            <p className="text-[11px] text-muted-foreground">{p.uhid}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {errors.patient && <p className="text-[11px] text-destructive">{errors.patient}</p>}
            </div>

            {/* Doctor + Department */}
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider">Doctor</label>
                    <select value={doctor} onChange={e => setDoctor(e.target.value)} className={inputCls("doctor")}>
                        <option value="">Select doctor</option>
                        {apiDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    {errors.doctor && <p className="text-[11px] text-destructive">{errors.doctor}</p>}
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider">Department</label>
                    <select value={department} onChange={e => setDepartment(e.target.value)} className={inputCls("department")}>
                        <option value="">Select dept</option>
                        {apiDepartments.map(d => <option key={d}>{d}</option>)}
                    </select>
                    {errors.department && <p className="text-[11px] text-destructive">{errors.department}</p>}
                </div>
            </div>

            {/* Appointment Type */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Appointment Type</label>
                <div className="flex flex-wrap gap-2">
                    {apiTypes.map(t => (
                        <button key={t} type="button" onClick={() => setType(t)}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                                type === t
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card border-border text-muted-foreground hover:border-primary/40"
                            )}>
                            {t}
                        </button>
                    ))}
                </div>
                {errors.type && <p className="text-[11px] text-destructive">{errors.type}</p>}
            </div>

            {/* Time Slots */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">
                    Time Slot {doctor && <span className="normal-case font-normal text-muted-foreground">({takenSlots.length} taken)</span>}
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                    {TIME_SLOTS.map(slot => {
                        const taken = takenSlots.includes(slot)
                        return (
                            <button key={slot} type="button"
                                disabled={taken}
                                onClick={() => !taken && setTime(slot)}
                                className={cn(
                                    "py-2 rounded-lg text-xs font-mono font-semibold border transition-all",
                                    taken ? "bg-muted border-border text-muted-foreground line-through opacity-50 cursor-not-allowed"
                                        : time === slot ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-card border-border hover:border-primary/40 text-foreground"
                                )}>
                                {slot}
                            </button>
                        )
                    })}
                </div>
                {errors.time && <p className="text-[11px] text-destructive">{errors.time}</p>}
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Notes <span className="normal-case font-normal text-muted-foreground">(optional)</span></label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                    placeholder="Chief complaint or reason for visit…"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all resize-none placeholder:text-muted-foreground" />
                <VoiceRecorder
                    onTextGenerated={(text) => setNotes((prev) => appendTranscript(prev, text))}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="flex-1">Book Appointment</Button>
            </div>
        </form>
    )
}

// ─── Reschedule Form ─────────────────────────────────────────────────────────
function RescheduleForm({ appt, onSubmit, onClose }: { appt: Appointment, onSubmit: (id: string, data: any) => void, onClose: () => void }) {
    const [doctor, setDoctor] = useState(appt.doctorId)
    const [date, setDate] = useState<Date | undefined>(new Date(appt.appointmentDate))
    const [time, setTime] = useState(appt.time)
    
    const { doctors: apiDoctors } = useDoctors()
    const { appointments: dayAppts } = useAppointments({ date: date?.toISOString() })
    
    const takenSlots = useMemo(() =>
        dayAppts.filter(a => a.doctorId === doctor && a.id !== appt.id).map(a => a.time),
        [dayAppts, doctor, appt.id]
    )

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!doctor || !date || !time) return
        onSubmit(appt.id, {
            doctorId: doctor,
            appointmentDate: new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(time.split(":")[0]), parseInt(time.split(":")[1])).toISOString(),
            timeSlot: time
        })
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-1">
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Date</label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                            <CalendarDays className="mr-2 size-4" />
                            {date ? fmtDate(date) : "Pick a date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Doctor</label>
                <select value={doctor} onChange={e => setDoctor(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all">
                    <option value="">Select doctor</option>
                    {apiDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
            </div>
            <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider">Time</label>
                <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1">
                    {TIME_SLOTS.map(slot => {
                        const taken = takenSlots.includes(slot)
                        return (
                            <button key={slot} type="button" disabled={taken} onClick={() => !taken && setTime(slot)}
                                className={cn("py-2 rounded-lg text-xs font-mono font-semibold border transition-all", taken ? "bg-muted border-border text-muted-foreground line-through opacity-50 cursor-not-allowed" : time === slot ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/40 text-foreground")}>
                                {slot}
                            </button>
                        )
                    })}
                </div>
            </div>
            <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="flex-1">Reschedule</Button>
            </div>
        </form>
    )
}

// ─── Appointment Detail Panel ─────────────────────────────────────────────────
function AppointmentDetail({ appt, onClose, onStatusChange, onReschedule, onDelete }: {
    appt: Appointment
    onClose: () => void
    onStatusChange: (id: string, status: ApptStatus) => void
    onReschedule?: (appt: Appointment) => void
    onDelete?: (id: string) => void
}) {
    const sc = statusConfig[appt.status]
    const Icon = sc.icon
    const actions = nextStatus[appt.status] ?? []
    // Patient details are directly populated or fetched separately in full app
    const patientDetail = { phone: "" }

    return (
        <div className="flex flex-col gap-5 p-1">
            {/* Status */}
            <div className="flex items-center justify-between">
                <Badge variant="outline" className={cn("text-xs font-semibold px-3 py-1 rounded-full gap-1.5", sc.className)}>
                    <Icon className="size-3.5" />
                    {sc.label}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">Token #{appt.token}</span>
            </div>

            {/* Patient Info */}
            <Card className="py-0">
                <CardContent className="px-4 py-4 flex items-start gap-3">
                    <Avatar className="size-12 shrink-0">
                        <AvatarFallback className={cn("text-sm font-semibold", appt.gender === "F" ? "bg-[#fce4ec] text-[#c2185b]" : "bg-[#e3f2fd] text-[#1565c0]")}>
                            {getInitials(appt.patientName)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                        <p className="font-bold text-foreground">{appt.patientName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{appt.uhid}</p>
                        <p className="text-xs text-muted-foreground">{appt.age} · {appt.gender === "F" ? "Female" : "Male"}</p>
                        {patientDetail?.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Phone className="size-3" />{patientDetail.phone}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Appointment Info */}
            <div className="flex flex-col gap-2.5">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Appointment Details</p>
                {[
                    { icon: User2, label: "Doctor", value: appt.doctor },
                    { icon: Stethoscope, label: "Department", value: appt.department },
                    { icon: Clock, label: "Time", value: `${appt.time} (${appt.duration} min)` },
                    { icon: FileText, label: "Type", value: appt.type },
                    { icon: Syringe, label: "UHID", value: appt.uhid },
                ].map(row => (
                    <div key={row.label} className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-7 rounded-lg bg-muted shrink-0">
                            <row.icon className="size-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{row.label}</span>
                            <span className="text-sm text-foreground">{row.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Actions */}
            {actions.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Update Status</p>
                    <div className="flex flex-wrap gap-2">
                        {actions.map(action => (
                            <Button key={action.next} variant="outline" size="sm" className="gap-1.5"
                                onClick={() => { onStatusChange(appt.id, action.next); onClose() }}>
                                <action.icon className="size-3.5" />
                                {action.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Extended Actions */}
            <div className="flex flex-col gap-2 pb-2 border-b border-border/40">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Manage Appointment</p>
                <div className="flex flex-wrap gap-2">
                    {appt.status === "Scheduled" && (
                        <Button variant="outline" size="sm" className="gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                            onClick={() => { onReschedule?.(appt); onClose() }}>
                            <CalendarDays className="size-3.5" /> Reschedule
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/5"
                        onClick={() => { onDelete?.(appt.id); onClose() }}>
                        <XCircle className="size-3.5" /> Delete
                    </Button>
                </div>
            </div>

            {/* Link to Patient Hub */}
            <a href={`/patients/${appt.patientId}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/40 hover:bg-primary/[0.02] transition-all group">
                <div className="flex items-center gap-2.5">
                    <BadgeCheck className="size-4 text-primary" />
                    <span className="text-sm font-medium">Open Patient Hub</span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>

            <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
        </div>
    )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function AppointmentsContent() {
    const TODAY = useMemo(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    }, [])

    const [selectedDate, setSelectedDate] = useState(TODAY)
    const [weekStart, setWeekStart] = useState(() => {
        const d = new Date(TODAY)
        d.setDate(d.getDate() - d.getDay()) // start of week (Sun)
        return d
    })
    const [statusFilter, setStatusFilter] = useState<ApptStatus | "all">("all")
    const [doctorFilter, setDoctorFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [bookingOpen, setBookingOpen] = useState(false)
    const [detailAppt, setDetailAppt] = useState<Appointment | null>(null)
    const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isMutating, setIsMutating] = useState(false)
    const [generatingOPFor, setGeneratingOPFor] = useState<string | null>(null)
    const [opError, setOPError] = useState<string | null>(null)

    const { doctors: apiDoctors } = useDoctors()
    const { appointments: appts, mutate, isLoading } = useAppointments({ date: selectedDate.toISOString() })
    const { stats, mutate: mutateStats } = useAppointmentStats(selectedDate.toISOString())
    const { calendar } = useMonthlyCalendar(
        `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}`,
        doctorFilter === "all" ? undefined : doctorFilter
    )

    const weekDates = useMemo(() =>
        Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart)
            d.setDate(weekStart.getDate() + i)
            return d
        }),
        [weekStart]
    )

    const navigateWeek = useCallback((dir: -1 | 1) => {
        setWeekStart(prev => {
            const d = new Date(prev)
            d.setDate(d.getDate() + dir * 7)
            return d
        })
    }, [])

    const goToday = useCallback(() => {
        setSelectedDate(TODAY)
        const d = new Date(TODAY)
        d.setDate(d.getDate() - d.getDay())
        setWeekStart(d)
    }, [])

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return appts.filter(a => {
            if (statusFilter !== "all" && a.status !== statusFilter) return false
            if (doctorFilter !== "all" && a.doctorId !== doctorFilter) return false
            if (q && !a.patientName.toLowerCase().includes(q) &&
                !a.uhid.toLowerCase().includes(q) &&
                !a.doctor.toLowerCase().includes(q)) return false
            return true
        }).sort((a, b) => a.time.localeCompare(b.time))
    }, [appts, statusFilter, doctorFilter, search])

    const counts = useMemo(() => ({
        all: stats?.total ?? 0,
        Scheduled: stats?.scheduled ?? 0,
        "In Progress": stats?.inProgress ?? 0,
        Completed: stats?.completed ?? 0,
        Cancelled: stats?.cancelled ?? 0,
        "No Show": stats?.noShow ?? 0,
    }), [stats])

    const handleBook = useCallback(async (appt: any) => {
        setIsMutating(true)
        try {
            await createAppointment(appt)
            await mutate()
            await mutateStats()
            setBookingOpen(false)
        } catch (e: any) {
            alert(e.message || "Failed to book appointment")
        } finally {
            setIsMutating(false)
        }
    }, [mutate, mutateStats])

    const handleStatusChange = useCallback(async (id: string, newStatus: ApptStatus) => {
        setIsMutating(true)
        try {
            await updateAppointmentStatus(id, newStatus)
            await mutate()
            await mutateStats()
        } catch (e: any) {
            alert("Failed to update status")
        } finally {
            setIsMutating(false)
        }
    }, [mutate, mutateStats])

    const handleReschedule = useCallback(async (id: string, data: any) => {
        setIsMutating(true)
        try {
            await rescheduleAppointment(id, data)
            await mutate()
            await mutateStats()
            setRescheduleAppt(null)
        } catch (e: any) {
            alert(e.message || "Failed to reschedule appointment")
        } finally {
            setIsMutating(false)
        }
    }, [mutate, mutateStats])

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm("Are you sure you want to delete this appointment?")) return
        setIsMutating(true)
        try {
            await deleteAppointment(id)
            await mutate()
            await mutateStats()
            setDetailAppt(null)
        } catch (e: any) {
            alert(e.message || "Failed to delete appointment")
        } finally {
            setIsMutating(false)
        }
    }, [mutate, mutateStats])

    const handleBulkStatus = useCallback(async (status: ApptStatus) => {
        if (!confirm(`Are you sure you want to mark ${selectedIds.size} appointments as ${status}?`)) return
        setIsMutating(true)
        try {
            await Promise.all(Array.from(selectedIds).map(id => updateAppointmentStatus(id, status)))
            await mutate()
            await mutateStats()
            setSelectedIds(new Set())
        } catch (e: any) {
            alert(e.message || "Failed to update appointments")
        } finally {
            setIsMutating(false)
        }
    }, [mutate, mutateStats, selectedIds])

    const handleGenerateOP = useCallback(async (appt: Appointment) => {
        setGeneratingOPFor(appt.id)
        setOPError(null)
        try {
            // 1. Create OP Visit (generates OP number, checks duplicates)
            const opVisit = await createOPVisit({
                patientId: appt.patientId,
                appointmentId: appt.id,
                doctorId: appt.doctorId,
                department: appt.department,
                notes: appt.chiefComplaint || undefined,
            })
            // 2. Create DRAFT Bill linked to visit
            const bill = await createBill({
                patientId: opVisit.patientId,
                appointmentId: appt.id,
                opVisitId: opVisit.id,
                notes: `OP Visit ${opVisit.opNumber} - ${appt.department}`,
            })
            // 3. Navigate to billing form with pre-loaded bill
            window.location.href = `/billing/op/new?billId=${bill.id}`
        } catch (e: any) {
            const msg = e?.message || "Failed to generate OP"
            setOPError(msg)
            alert(msg)
        } finally {
            setGeneratingOPFor(null)
        }
    }, [])

    const monthLabel = (() => {
        const first = weekDates[0], last = weekDates[6]
        if (first.getMonth() === last.getMonth())
            return first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
        return `${first.toLocaleDateString("en-IN", { month: "short" })} – ${last.toLocaleDateString("en-IN", { month: "short", year: "numeric" })}`
    })()

    return (
        <>
            <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-[1600px] mx-auto">

                {/* ── Page Header ───────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-foreground tracking-tight">Appointments</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 print:hidden">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 font-normal text-muted-foreground hover:text-foreground">
                                        <CalendarDays className="size-3.5" />
                                        {fmtDate(selectedDate)}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(val) => {
                                            if (val) {
                                                setSelectedDate(val)
                                                const d = new Date(val)
                                                d.setDate(d.getDate() - d.getDay())
                                                setWeekStart(d)
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <p className="text-sm text-muted-foreground">
                                &middot; {filtered.length} appointments
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 print:hidden">
                        {selectedIds.size > 0 && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="gap-2 border-primary/20 text-primary">
                                        Bulk Actions ({selectedIds.size}) <ChevronDown className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleBulkStatus("Cancelled")} className="text-destructive font-medium cursor-pointer">
                                        <XCircle className="size-4 mr-2" /> Cancel Selected
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleBulkStatus("Completed")} className="font-medium cursor-pointer text-emerald-700">
                                        <CheckCircle2 className="size-4 mr-2" /> Mark Completed
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <Button variant="outline" className="gap-2 text-muted-foreground hidden sm:flex" onClick={() => window.print()}>
                            <Printer className="size-4" /> Print Day Sheet
                        </Button>
                        <Button variant="outline" className="gap-2 text-muted-foreground sm:hidden" onClick={() => window.print()}>
                            <Printer className="size-4" /> Print
                        </Button>
                        <Button className="gap-2" onClick={() => setBookingOpen(true)}>
                            <Plus className="size-4" />
                            New Appointment
                        </Button>
                    </div>
                </div>

                {/* ── Week Calendar Strip ───────────────────────────────────────── */}
                <Card className="py-0 print:hidden">
                    <CardContent className="px-4 py-3">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => navigateWeek(-1)}>
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <span className="text-sm font-semibold text-foreground min-w-[150px] text-center">{monthLabel}</span>
                                <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => navigateWeek(1)}>
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                            <Button variant="outline" size="sm" className="text-xs h-7 gap-1.5" onClick={goToday}>
                                <CalendarDays className="size-3.5" />
                                Today
                            </Button>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {weekDayNames.map(d => (
                                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground pb-1">{d}</div>
                            ))}
                            {weekDates.map((date, i) => {
                                const isSelected = isSameDay(date, selectedDate)
                                const isToday = isSameDay(date, TODAY)
                                const dayCount = calendar?.days?.[date.getDate()] || 0
                                return (
                                    <button key={i}
                                        onClick={() => setSelectedDate(date)}
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-lg py-1.5 text-sm font-medium transition-colors relative",
                                            isSelected
                                                ? "bg-primary text-primary-foreground"
                                                : isToday
                                                    ? "border border-primary/40 text-primary"
                                                    : "hover:bg-muted text-foreground"
                                        )}>
                                        {date.getDate()}
                                        {isToday && !isSelected && (
                                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3 h-[2px] rounded-full bg-primary" />
                                        )}
                                        {isSelected && (
                                            <span className="mt-0.5 size-1 rounded-full bg-primary-foreground/60" />
                                        )}
                                        {dayCount > 0 && !isSelected && (
                                            <span className="absolute top-0.5 right-1.5 text-[9px] font-bold text-muted-foreground/50">{dayCount}</span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* ── KPI Row ──────────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
                    {[
                        { label: "Total", value: counts.all, color: "text-primary", bg: "bg-primary/10" },
                        { label: "Completed", value: counts.Completed, color: "text-[#1a7a4c]", bg: "bg-[#e6f6ee]" },
                        { label: "Pending", value: counts.Scheduled + counts["In Progress"], color: "text-[#1a6fb5]", bg: "bg-[#e8f4fd]" },
                        { label: "Cancelled / No Show", value: counts.Cancelled + counts["No Show"], color: "text-[#c53030]", bg: "bg-[#fde8e8]" },
                    ].map(stat => (
                        <Card key={stat.label} className="py-0">
                            <CardContent className="flex items-center gap-3 px-4 py-3">
                                <div className={cn("flex items-center justify-center size-9 rounded-lg shrink-0", stat.bg)}>
                                    <CalendarDays className={cn("size-4", stat.color)} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-foreground tabular-nums">{stat.value}</p>
                                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Status Filter Chips ───────────────────────────────────────── */}
                <div className="flex flex-wrap gap-2 print:hidden">
                    {(["all", "Scheduled", "In Progress", "Completed", "Cancelled", "No Show"] as const).map(s => {
                        const isActive = statusFilter === s
                        const count = s === "all" ? counts.all : counts[s]
                        return (
                            <button key={s}
                                onClick={() => setStatusFilter(isActive && s !== "all" ? "all" : s)}
                                className={cn(
                                    "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                                    isActive
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                )}>
                                <span>{s === "all" ? "All" : s}</span>
                                <span className={cn(
                                    "flex items-center justify-center size-5 rounded-full text-[10px] font-bold",
                                    isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* ── Search + Doctor Filter ────────────────────────────────────── */}
                <Card className="py-0 print:hidden">
                    <CardContent className="px-4 py-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <input type="search" value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search by patient, UHID, or doctor…"
                                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all" />
                                {search && (
                                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {apiDoctors.map(d => (
                                    <button key={d.id}
                                        onClick={() => setDoctorFilter(doctorFilter === d.id ? "all" : d.id)}
                                        className={cn(
                                            "hidden md:flex items-center gap-1.5 rounded-lg border px-3 h-9 text-xs font-medium transition-all shrink-0",
                                            doctorFilter === d.id
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-card text-muted-foreground border-border hover:border-primary/40"
                                        )}>
                                        {d.name.replace("Dr. ", "")}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Appointments Table ────────────────────────────────────────── */}
                <Card className="py-0 overflow-hidden">
                    <CardHeader className="px-4 py-3 border-b border-border bg-muted/30">
                        <CardTitle className="text-sm font-semibold text-foreground">
                            Showing {filtered.length} of {appts.length} appointments
                        </CardTitle>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    <th className="px-4 py-2.5 w-10">
                                        <input type="checkbox" className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                            checked={filtered.length > 0 && selectedIds.size === filtered.length}
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedIds(new Set(filtered.map(a => a.id)))
                                                else setSelectedIds(new Set())
                                            }} />
                                    </th>
                                    {["Token", "Patient", "Time", "Doctor / Dept", "Type", "Status", "Actions"].map(h => (
                                        <th key={h} className={cn(
                                            "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
                                            h === "Actions" && "text-right"
                                        )}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-14">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="size-9 animate-spin text-muted-foreground/30" />
                                                <p className="text-sm text-muted-foreground">Loading appointments...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-14">
                                            <div className="flex flex-col items-center gap-2">
                                                <CalendarDays className="size-9 text-muted-foreground/30" />
                                                <p className="text-sm text-muted-foreground">No appointments found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(a => {
                                        const sc = statusConfig[a.status]
                                        const Icon = sc.icon
                                        const actions = nextStatus[a.status] ?? []
                                        return (
                                            <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors group">
                                                <td className="px-4 py-3">
                                                    <input type="checkbox" className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                                        checked={selectedIds.has(a.id)}
                                                        onChange={(e) => {
                                                            const next = new Set(selectedIds)
                                                            if (e.target.checked) next.add(a.id)
                                                            else next.delete(a.id)
                                                            setSelectedIds(next)
                                                        }} />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center justify-center size-7 rounded-full bg-primary/10 text-xs font-bold text-primary tabular-nums">
                                                        {a.token}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar className="size-8 shrink-0">
                                                            <AvatarFallback className={cn("text-[11px] font-semibold",
                                                                a.gender === "F" ? "bg-[#fce4ec] text-[#c2185b]" : "bg-[#e3f2fd] text-[#1565c0]")}>
                                                                {getInitials(a.patientName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">{a.patientName}</p>
                                                            <p className="text-[11px] text-muted-foreground">{a.uhid} &middot; {a.age}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock className="size-3.5 text-muted-foreground shrink-0" />
                                                        <span className="text-sm font-mono text-foreground">{a.time}</span>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">{a.duration} min</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm text-foreground">{a.doctor}</p>
                                                    <p className="text-[11px] text-muted-foreground">{a.department}</p>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-muted-foreground">{a.type}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {/* Status with inline quick-change dropdown */}
                                                    {actions.length > 0 ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button className={cn(
                                                                    "flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-all hover:opacity-80",
                                                                    sc.className
                                                                )}>
                                                                    <Icon className="size-3" />
                                                                    {sc.label}
                                                                    <ChevronDown className="size-3 ml-0.5 opacity-70" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start" className="min-w-[140px]">
                                                                {actions.map(action => (
                                                                    <DropdownMenuItem key={action.next}
                                                                        onClick={() => handleStatusChange(a.id, action.next)}
                                                                        className="gap-2 text-xs">
                                                                        <action.icon className="size-3.5" />
                                                                        {action.label}
                                                                    </DropdownMenuItem>
                                                                ))}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <Badge variant="outline" className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full gap-1", sc.className)}>
                                                            <Icon className="size-3" />
                                                            {sc.label}
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {/* Generate OP — only for billable statuses */}
                                                        {["Scheduled", "In Progress", "Completed"].includes(a.status) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-xs h-7 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                                                disabled={generatingOPFor === a.id}
                                                                onClick={() => handleGenerateOP(a)}
                                                            >
                                                                {generatingOPFor === a.id ? (
                                                                    <Loader2 className="size-3.5 animate-spin" />
                                                                ) : (
                                                                    <FileText className="size-3.5" />
                                                                )}
                                                                {generatingOPFor === a.id ? "Generating..." : "Generate OP"}
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm"
                                                            className="text-xs text-primary h-7 gap-1.5"
                                                            onClick={() => setDetailAppt(a)}>
                                                            <Eye className="size-3.5" />
                                                            View
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* ── New Appointment Sheet ──────────────────────────────────────────── */}
            <Sheet open={bookingOpen} onOpenChange={setBookingOpen}>
                <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto">
                    <SheetHeader className="pb-4 border-b border-border mb-5">
                        <SheetTitle className="flex items-center gap-2">
                            <CalendarDays className="size-5 text-primary" />
                            New Appointment
                        </SheetTitle>
                        <SheetDescription>
                            Book a new appointment for {fmtDate(selectedDate)}
                        </SheetDescription>
                    </SheetHeader>
                    <BookingForm selectedDate={selectedDate} onSubmit={handleBook} onClose={() => setBookingOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* ── Appointment Detail Sheet ───────────────────────────────────────── */}
            <Sheet open={!!detailAppt} onOpenChange={open => !open && setDetailAppt(null)}>
                <SheetContent side="right" className="w-full sm:max-w-[420px] overflow-y-auto">
                    <SheetHeader className="pb-4 border-b border-border mb-5">
                        <SheetTitle className="flex items-center gap-2">
                            <Eye className="size-5 text-primary" />
                            Appointment Details
                        </SheetTitle>
                        <SheetDescription>
                            {detailAppt?.patientName} &middot; {detailAppt?.time}
                        </SheetDescription>
                    </SheetHeader>
                    {detailAppt && (
                        <AppointmentDetail
                            appt={detailAppt}
                            onClose={() => setDetailAppt(null)}
                            onStatusChange={handleStatusChange}
                            onReschedule={setRescheduleAppt}
                            onDelete={handleDelete}
                        />
                    )}
                </SheetContent>
            </Sheet>

            {/* ── Reschedule Sheet ─────────────────────────────────────────────── */}
            <Sheet open={!!rescheduleAppt} onOpenChange={open => !open && setRescheduleAppt(null)}>
                <SheetContent side="right" className="w-full sm:max-w-[420px] overflow-y-auto">
                    <SheetHeader className="pb-4 border-b border-border mb-5">
                        <SheetTitle className="flex items-center gap-2">
                            <CalendarDays className="size-5 text-primary" />
                            Reschedule Appointment
                        </SheetTitle>
                        <SheetDescription>
                            {rescheduleAppt?.patientName} (Token #{rescheduleAppt?.token})
                        </SheetDescription>
                    </SheetHeader>
                    {rescheduleAppt && (
                        <RescheduleForm
                            appt={rescheduleAppt}
                            onSubmit={handleReschedule}
                            onClose={() => setRescheduleAppt(null)}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}
