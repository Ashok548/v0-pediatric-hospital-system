"use client"

import { useState, useMemo } from "react"
import { useAppointments } from "@/lib/api/appointments"
import { useDoctors } from "@/lib/api/appointments"
import { apiClient } from "@/lib/api-client"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CheckCircle2, Clock, User, Stethoscope, CalendarDays, Loader2, IndianRupee } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectedVisit {
    visitId?: string          // appointment ID (null for walk-in)
    patientId: string         // direct DB patient id
    patientName: string
    uhid: string
    doctorId: string
    doctorName: string
    consultationFee: number
    department: string
    visitDate: string         // ISO date string
    isWalkIn: boolean
}

const statusStyle: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    Completed: { label: "Completed", className: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
    "In Progress": { label: "In Progress", className: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
    Scheduled: { label: "Scheduled", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
}
const BILLABLE_STATUSES = ["Completed", "In Progress", "Scheduled"]

// Clamp a date to [today, today+7]
function clampDate(d: Date): Date {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const max = new Date(today); max.setDate(max.getDate() + 7)
    if (d < today) return today
    if (d > max) return max
    return d
}
function toDateInputValue(d: Date) {
    return d.toISOString().slice(0, 10)
}
function todayStr() { return toDateInputValue(new Date()) }
function maxStr() {
    const d = new Date(); d.setDate(d.getDate() + 7)
    return toDateInputValue(d)
}

export function PatientVisitSelector({ onSelect }: { onSelect: (visit: SelectedVisit) => void }) {
    // ── Shared state ───────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<"appointment" | "walkin">("appointment")

    // ── Tab 1: Appointment ─────────────────────────────────────────
    const [apptDate, setApptDate] = useState(todayStr())
    const [apptSearch, setApptSearch] = useState("")
    const { appointments = [], isLoading: apptLoading } = useAppointments({
        date: new Date(apptDate).toISOString()
    })
    const filteredAppts = appointments
        .filter(a => BILLABLE_STATUSES.includes(a.status))
        .filter(a => apptSearch
            ? a.patientName.toLowerCase().includes(apptSearch.toLowerCase()) ||
              a.uhid.toLowerCase().includes(apptSearch.toLowerCase()) ||
              (a.doctor && a.doctor.toLowerCase().includes(apptSearch.toLowerCase()))
            : true
        )

    // ── Tab 2: Walk-in ─────────────────────────────────────────────
    const [walkSearch, setWalkSearch] = useState("")
    const [walkSearchResults, setWalkSearchResults] = useState<any[]>([])
    const [walkSearching, setWalkSearching] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null)
    const [selectedDoctorId, setSelectedDoctorId] = useState("")
    const [walkDate, setWalkDate] = useState(todayStr())
    const { doctors, isLoading: doctorsLoading } = useDoctors()

    const selectedDoctor = doctors.find(d => d.id === selectedDoctorId)

    const handlePatientSearch = async () => {
        if (!walkSearch.trim()) return
        setWalkSearching(true)
        try {
            const res = await apiClient<{ data: any[] }>(`/patients?search=${encodeURIComponent(walkSearch)}`)
            setWalkSearchResults(res?.data ?? [])
        } catch {
            setWalkSearchResults([])
        } finally {
            setWalkSearching(false)
        }
    }

    const handleWalkInStart = () => {
        if (!selectedPatient || !selectedDoctorId || !selectedDoctor) return
        onSelect({
            patientId: selectedPatient.id,
            patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
            uhid: selectedPatient.uhid,
            doctorId: selectedDoctorId,
            doctorName: selectedDoctor.name,
            consultationFee: Number(selectedDoctor.consultationFee),
            department: "Outpatient",
            visitDate: new Date(walkDate).toISOString(),
            isWalkIn: true,
        })
    }

    return (
        <Card>
            <CardHeader className="py-4 border-b">
                <CardTitle className="text-base font-semibold">Select Patient Visit</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
                    <TabsList className="w-full mb-4">
                        <TabsTrigger value="appointment" className="flex-1 gap-2">
                            <CalendarDays className="size-4" /> From Appointment
                        </TabsTrigger>
                        <TabsTrigger value="walkin" className="flex-1 gap-2">
                            <User className="size-4" /> Walk-in
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Tab 1: From Appointment ── */}
                    <TabsContent value="appointment" className="space-y-3 mt-0">
                        {/* Date picker */}
                        <div className="flex gap-3 items-end">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs text-muted-foreground">Visit Date</Label>
                                <Input
                                    type="date"
                                    value={apptDate}
                                    min={todayStr()}
                                    max={maxStr()}
                                    onChange={e => setApptDate(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    className="pl-9 h-8 text-sm"
                                    placeholder="Search name, UHID, doctor..."
                                    value={apptSearch}
                                    onChange={e => setApptSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Visit rows */}
                        <div className="border rounded-md overflow-hidden divide-y max-h-72 overflow-y-auto">
                            {apptLoading ? (
                                <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin size-4" /> Loading visits...
                                </div>
                            ) : filteredAppts.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No matching visits for this date.
                                </div>
                            ) : (
                                filteredAppts.map(appt => {
                                    const s = statusStyle[appt.status] ?? statusStyle["Scheduled"]
                                    const Icon = s.icon
                                    return (
                                        <button
                                            key={appt.id}
                                            onClick={() => onSelect({
                                                visitId: appt.id,
                                                patientId: appt.patientId,
                                                patientName: appt.patientName,
                                                uhid: appt.uhid,
                                                doctorId: appt.doctorId || "",
                                                doctorName: appt.doctor || "",
                                                consultationFee: 0, // resolved by OPBillingForm from doctor list
                                                department: appt.department,
                                                visitDate: new Date(apptDate).toISOString(),
                                                isWalkIn: false,
                                            })}
                                            className="w-full px-4 py-3 text-left hover:bg-muted/40 transition-colors flex items-center justify-between gap-4"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                                                        appt.gender === "F" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"
                                                    )}>
                                                        {appt.patientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{appt.patientName}</p>
                                                        <p className="text-[11px] text-muted-foreground">{appt.uhid} · {appt.age} · Token #{appt.token}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 pl-9">{appt.doctor} · {appt.department}</p>
                                            </div>
                                            <Badge variant="outline" className={cn("flex items-center gap-1 shrink-0", s.className)}>
                                                <Icon className="size-3" />{s.label}
                                            </Badge>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                        {!apptLoading && (
                            <p className="text-[11px] text-muted-foreground">
                                {filteredAppts.length} visits · {new Date(apptDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                            </p>
                        )}
                    </TabsContent>

                    {/* ── Tab 2: Walk-in ── */}
                    <TabsContent value="walkin" className="space-y-4 mt-0">
                        {/* Patient search */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Patient</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        placeholder="Search by UHID or name..."
                                        value={walkSearch}
                                        onChange={e => setWalkSearch(e.target.value)}
                                        onKeyDown={e => e.key === "Enter" && handlePatientSearch()}
                                    />
                                </div>
                                <Button variant="outline" onClick={handlePatientSearch} disabled={walkSearching}>
                                    {walkSearching ? <Loader2 className="animate-spin size-4" /> : "Search"}
                                </Button>
                            </div>

                            {/* Search results */}
                            {walkSearchResults.length > 0 && !selectedPatient && (
                                <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                                    {walkSearchResults.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => { setSelectedPatient(p); setWalkSearchResults([]) }}
                                            className="w-full px-3 py-2 text-left hover:bg-muted/40 flex items-center gap-3"
                                        >
                                            <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold shrink-0">
                                                {`${p.firstName[0]}${p.lastName[0]}`.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{p.firstName} {p.lastName}</p>
                                                <p className="text-[11px] text-muted-foreground">{p.uhid} · {p.phone}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Selected patient chip */}
                            {selectedPatient && (
                                <div className="flex items-center justify-between p-2.5 bg-primary/5 border border-primary/20 rounded-md">
                                    <div className="flex items-center gap-2 text-sm">
                                        <User className="size-4 text-primary" />
                                        <span className="font-semibold">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                                        <span className="text-muted-foreground text-xs">UHID: {selectedPatient.uhid}</span>
                                    </div>
                                    <button onClick={() => setSelectedPatient(null)} className="text-xs text-muted-foreground hover:text-destructive">Change</button>
                                </div>
                            )}
                        </div>

                        {/* Doctor selection */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Consulting Doctor</Label>
                            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                                <SelectTrigger>
                                    <SelectValue placeholder={doctorsLoading ? "Loading doctors..." : "Select doctor..."} />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map(d => (
                                        <SelectItem key={d.id} value={d.id}>
                                            <span className="flex items-center gap-2">
                                                <Stethoscope className="size-3.5 text-muted-foreground" />
                                                {d.name}
                                                {Number(d.consultationFee) > 0 && (
                                                    <span className="ml-1 text-xs text-muted-foreground font-mono">
                                                        ₹{Number(d.consultationFee).toLocaleString("en-IN")}
                                                    </span>
                                                )}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedDoctor && Number(selectedDoctor.consultationFee) > 0 && (
                                <p className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                    <IndianRupee className="size-3" />
                                    Consultation fee ₹{Number(selectedDoctor.consultationFee).toLocaleString("en-IN")} will be auto-added
                                </p>
                            )}
                        </div>

                        {/* Visit date */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visit Date</Label>
                            <Input
                                type="date"
                                value={walkDate}
                                min={todayStr()}
                                max={maxStr()}
                                onChange={e => setWalkDate(e.target.value)}
                            />
                        </div>

                        <Button
                            className="w-full gap-2"
                            disabled={!selectedPatient || !selectedDoctorId}
                            onClick={handleWalkInStart}
                        >
                            <CheckCircle2 className="size-4" /> Start Billing
                        </Button>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}
