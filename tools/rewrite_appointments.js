const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Rupa\\Documents\\Ashok Projects\\v0-pediatric-hospital-system\\apps\\web\\components\\hospital\\appointments-content.tsx';

let content = fs.readFileSync(filePath, 'utf-8');

// 1. Imports
content = content.replace(
    'import { appointments as initialAppointments } from "@/lib/data/appointments"\nimport { patients } from "@/lib/data/patients"\nimport type { Appointment, ApptStatus } from "@carenest/shared-types"',
    'import type { Appointment, ApptStatus } from "@carenest/shared-types"\nimport { useAppointments, useDoctors, createAppointment, updateAppointmentStatus, DoctorListMember } from "@/lib/api/appointments"\nimport { usePatients, ApiPatient } from "@/lib/api/patients"\nimport { toast } from "sonner"\nimport { format, isSameDay, startOfWeek, addDays, getMonth } from "date-fns"'
);

// 2. DOCTORS hardcoded
content = content.replace(
    'const DOCTORS = ["Dr. Anil Kumar", "Dr. Priya Reddy", "Dr. Meera Iyer"]',
    ''
);

// 3. Date utils
content = content.replace(
    'function fmtDate(d: Date) {\n    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })\n}\n\nfunction isSameDay(a: Date, b: Date) {\n    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()\n}',
    'function fmtDate(d: Date) {\n    return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })\n}\n\n// isSameDay imported from date-fns'
);

// 4. BookingForm props & state
content = content.replace(
    'interface BookingFormProps {\n    onSubmit: (appt: Omit<Appointment, "id" | "token">) => void\n    onClose: () => void\n}',
    'interface BookingFormProps {\n    onSubmit: (appt: any) => void\n    onClose: () => void\n    doctorsList: DoctorListMember[]\n}'
);

content = content.replace(
    'function BookingForm({ onSubmit, onClose }: BookingFormProps) {\n    const [uhidQuery, setUhidQuery] = useState("")\n    const [selectedPatient, setSelectedPatient] = useState<typeof patients[0] | null>(null)',
    'function BookingForm({ onSubmit, onClose, doctorsList }: BookingFormProps) {\n    const [uhidQuery, setUhidQuery] = useState("")\n    const [selectedPatient, setSelectedPatient] = useState<ApiPatient | null>(null)'
);

content = content.replace(
    '    const patientMatches = useMemo(() => {\n        if (uhidQuery.length < 2) return []\n        const q = uhidQuery.toLowerCase()\n        return patients.filter(p =>\n            p.uhid.toLowerCase().includes(q) ||\n            `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)\n        ).slice(0, 5)\n    }, [uhidQuery])',
    `    // Debounce this in a real app
    const { patients: patientMatches } = usePatients(uhidQuery.length >= 2 ? { search: uhidQuery, limit: 5 } : {});`
);

content = content.replace(
    '    const takenSlots = useMemo(() =>\n        initialAppointments.filter(a => a.doctor === doctor).map(a => a.time),\n        [doctor]\n    )',
    `    const { appointments: doctorAppts } = useAppointments(doctor ? { doctorId: doctor, date: new Date().toISOString() } : {})
    const takenSlots = useMemo(() =>
        doctorAppts.map(a => a.time),
        [doctorAppts]
    )`
);

// 5. Form Submit shape
content = content.replace(
    '        onSubmit({\n            patientName: `${selectedPatient.firstName} ${selectedPatient.lastName}`,\n            uhid: selectedPatient.uhid,\n            age: `${selectedPatient.ageYears}y ${selectedPatient.ageMonths}mo`,\n            gender: selectedPatient.gender,\n            doctor,\n            department,\n            time,\n            duration: 20,\n            status: "Scheduled",\n            type,\n        })',
    `        onSubmit({
            patientId: selectedPatient.id,
            doctorId: doctor,
            department,
            appointmentDate: new Date().toISOString(),
            timeSlot: time,
            duration: 20,
            type,
            notes,
            chiefComplaint: notes
        })`
);

// 6. Patient render in BookingForm matches ApiPatient format
content = content.replace(
    '{selectedPatient.ageYears}y {selectedPatient.ageMonths}mo · {selectedPatient.gender === "F" ? "Female" : "Male"}',
    'DOB: {new Date(selectedPatient.dateOfBirth).toLocaleDateString()} · {selectedPatient.gender === "F" ? "Female" : "Male"}'
);

// 7. Patient Matches Dropdown format
content = content.replace(
    '{p.uhid} · {p.status}',
    '{p.uhid}'
);

// 8. Doctor Options in Dropdown
content = content.replace(
    '{DOCTORS.map(d => <option key={d}>{d}</option>)}',
    '{doctorsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}'
);

// 9. AppointmentDetail patient lookup
content = content.replace(
    'const patientDetail = patients.find(p => p.uhid === appt.uhid)',
    '// Patient details are directly populated or fetched separately in full app\n    const patientDetail = { phone: "" }'
);

// 10. Main Component
content = content.replace(
    'export function AppointmentsContent() {\n    const TODAY = new Date(2026, 1, 22) // Feb 22, 2026\n\n    const [appts, setAppts] = useState<Appointment[]>(initialAppointments)\n    const [selectedDate, setSelectedDate] = useState(TODAY)',
    'export function AppointmentsContent() {\n    const TODAY = useMemo(() => new Date(), [])\n\n    const [selectedDate, setSelectedDate] = useState(TODAY)'
);

content = content.replace(
    'const doctors = useMemo(() => [...new Set(appts.map(a => a.doctor))].sort(), [appts])',
    'const { doctors: apiDoctors } = useDoctors()\n    const { appointments: appts, mutate } = useAppointments({ date: selectedDate.toISOString() })'
);

// 11. Handle submit mapping
content = content.replace(
    'const handleBook = useCallback((appt: Omit<Appointment, "id" | "token">) => {\n        setAppts(prev => {\n            const id = `A-${String(prev.length + 1).padStart(3, "0")}`\n            const token = prev.length + 1\n            return [...prev, { ...appt, id, token }]\n        })\n        setBookingOpen(false)\n    }, [])',
    `const handleBook = async (appt: any) => {
        try {
            await createAppointment(appt)
            toast.success("Appointment booked successfully")
            mutate()
            setBookingOpen(false)
        } catch (err: any) {
            toast.error(err.message || "Failed to book appointment")
        }
    }`
);

content = content.replace(
    'const handleStatusChange = useCallback((id: string, status: ApptStatus) => {\n        setAppts(prev => prev.map(a => a.id === id ? { ...a, status } : a))\n    }, [])',
    `const handleStatusChange = async (id: string, status: ApptStatus) => {
        try {
            await updateAppointmentStatus(id, status)
            toast.success("Status updated")
            mutate()
        } catch (err: any) {
            toast.error(err.message || "Failed to update status")
        }
    }`
);

// 12. Replace doctor tabs "doctors" with "apiDoctors"
content = content.replace(
    '{doctors.map(d => (',
    '{apiDoctors.map(d => ('
);
content = content.replace(
    'onClick={() => setDoctorFilter(doctorFilter === d ? "all" : d)}',
    'onClick={() => setDoctorFilter(doctorFilter === d.id ? "all" : d.id)}'
);
content = content.replace(
    'doctorFilter === d',
    'doctorFilter === d.id'
);
content = content.replace(
    '{d.replace("Dr. ", "")}',
    '{d.name.replace("Dr. ", "")}'
);
content = content.replace(
    'a.doctor !== doctorFilter',
    'a.doctorId !== doctorFilter'
);
content = content.replace(
    '<BookingForm onSubmit={handleBook} onClose={() => setBookingOpen(false)} />',
    '<BookingForm onSubmit={handleBook} onClose={() => setBookingOpen(false)} doctorsList={apiDoctors} />'
);

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Rewrite complete");
