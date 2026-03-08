const fs = require('fs');

const path = 'apps/web/components/hospital/appointments-content.tsx';
let text = fs.readFileSync(path, 'utf-8');

const rep = (target, replacement) => {
    const normTarget = target.replace(/\r\n/g, '\n');
    let normText = text.replace(/\r\n/g, '\n');
    if (normText.includes(normTarget)) {
        normText = normText.replace(normTarget, replacement.replace(/\r\n/g, '\n'));
        text = normText;
    } else {
        console.log("Could not find target:\n" + target.substring(0, 50) + "...");
    }
}

rep(`import { appointments as initialAppointments } from "@/lib/data/appointments"
import { patients } from "@/lib/data/patients"
import type { Appointment, ApptStatus } from "@carenest/shared-types"`,
    `import type { Appointment, ApptStatus } from "@carenest/shared-types"
import { usePatients } from "@/lib/api/patients"
import { useAppointments, useDoctors, createAppointment, updateAppointmentStatus, useAppointmentStats } from "@/lib/api/appointments"`);

rep(`    const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null)`,
    `    const [selectedPatient, setSelectedPatient] = useState<any | null>(null)`);

rep(`    const patientMatches = useMemo(() => {
        if (uhidQuery.length < 2) return []
        const q = uhidQuery.toLowerCase()
        return patients.filter(p =>
            p.uhid.toLowerCase().includes(q) ||
            \`\${p.firstName} \${p.lastName}\`.toLowerCase().includes(q)
        ).slice(0, 5)
    }, [uhidQuery])

    const takenSlots = useMemo(() =>
        initialAppointments.filter(a => a.doctor === doctor).map(a => a.time),
        [doctor]
    )`,
    `    const { patients, isLoading: isLoadingPatients } = usePatients({ search: uhidQuery, limit: 5 })

    const patientMatches = useMemo(() => {
        if (uhidQuery.length < 2) return []
        return patients
    }, [uhidQuery, patients])

    const { doctors: apiDoctors } = useDoctors()
    const { appointments: todaysAppts } = useAppointments({ date: new Date().toISOString() })
    
    const takenSlots = useMemo(() =>
        todaysAppts.filter(a => a.doctorId === doctor).map(a => a.time),
        [todaysAppts, doctor]
    )`);

rep(`    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate() || !selectedPatient) return
        onSubmit({
            patientName: \`\${selectedPatient.firstName} \${selectedPatient.lastName}\`,
            uhid: selectedPatient.uhid,
            age: \`\${selectedPatient.ageYears}y \${selectedPatient.ageMonths}mo\`,
            gender: selectedPatient.gender,
            doctor,
            doctorId: doctor,
            department,
            appointmentDate: new Date().toISOString(),
            time,
            duration: 20,
            status: "Scheduled",
            type,
            notes,
        } as any)
    }`,
    `    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!validate() || !selectedPatient) return
        
        const now = new Date()
        const selectedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(time.split(":")[0]), parseInt(time.split(":")[1])).toISOString()
        
        onSubmit({
            patientId: selectedPatient.id,
            doctorId: doctor,
            department,
            appointmentDate: selectedDate,
            timeSlot: time,
            type,
            notes,
        } as any)
    }`);

rep(`                        {patientMatches.length > 0 ? (
                            patientMatches.map(p => (
                                <button key={p.id} type="button"
                                    onClick={() => {
                                        setSelectedPatient(p)
                                        setUhidQuery(\`\${p.firstName} \${p.lastName} (\${p.uhid})\`)
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted font-medium flex items-center justify-between">
                                    <span>{p.firstName} {p.lastName}</span>
                                    <span className="text-muted-foreground font-mono text-xs">{p.uhid}</span>
                                </button>
                            ))
                        ) : uhidQuery.length >= 2 ? (`,
    `                        {isLoadingPatients ? (
                            <div className="p-3 text-center text-sm text-muted-foreground">Searching...</div>
                        ) : patientMatches.length > 0 ? (
                            patientMatches.map(p => (
                                <button key={p.id} type="button"
                                    onClick={() => {
                                        setSelectedPatient(p)
                                        setUhidQuery(\`\${p.firstName} \${p.lastName} (\${p.uhid})\`)
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted font-medium flex items-center justify-between">
                                    <span>{p.firstName} {p.lastName}</span>
                                    <span className="text-muted-foreground font-mono text-xs">{p.uhid}</span>
                                </button>
                            ))
                        ) : uhidQuery.length >= 2 ? (`);

rep(`                        {doctorsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}`, `                        {apiDoctors ? apiDoctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>) : null}`);

rep(`    const [appts, setAppts] = useState<Appointment[]>(initialAppointments)
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

    const { doctors: apiDoctors } = useDoctors()
    const { appointments: appts, mutate } = useAppointments({ date: selectedDate.toISOString() })`,
    `    const [selectedDate, setSelectedDate] = useState(TODAY)
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
    const [isMutating, setIsMutating] = useState(false)

    const { doctors: apiDoctors } = useDoctors()
    const { appointments: appts, mutate, isLoading } = useAppointments({ date: selectedDate.toISOString() })
    const { stats, mutate: mutateStats } = useAppointmentStats(selectedDate.toISOString())`);

rep(`    const counts = useMemo(() => ({
        all: appts.length,
        Scheduled: appts.filter(a => a.status === "Scheduled").length,
        "In Progress": appts.filter(a => a.status === "In Progress").length,
        Completed: appts.filter(a => a.status === "Completed").length,
        Cancelled: appts.filter(a => a.status === "Cancelled").length,
        "No Show": appts.filter(a => a.status === "No Show").length,
    }), [appts])`,
    `    const counts = useMemo(() => ({
        all: stats?.total ?? 0,
        Scheduled: stats?.scheduled ?? 0,
        "In Progress": stats?.inProgress ?? 0,
        Completed: stats?.completed ?? 0,
        Cancelled: stats?.cancelled ?? 0,
        "No Show": stats?.noShow ?? 0,
    }), [stats])`);

rep(`    const handleBook = useCallback((appt: Omit<Appointment, "id" | "token">) => {
        setAppts(prev => {
            const id = \`A-\${String(prev.length + 1).padStart(3, "0")}\`
            const token = prev.length + 1
            return [...prev, { ...appt, id, token }]
        })
        setBookingOpen(false)
    }, [])

    const handleStatusChange = useCallback((id: string, status: ApptStatus) => {
        setAppts(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    }, [])`,
    `    const handleBook = useCallback(async (appt: any) => {
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
    }, [mutate, mutateStats])`);

fs.writeFileSync(path, text, 'utf-8');
console.log("Done fixing appointments-content.tsx");
