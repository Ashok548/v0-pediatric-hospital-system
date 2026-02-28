// ─────────────────────────────────────────────────────────────────────────────
// lib/data/vitals.ts
// Types and mock data for Nursing Vitals & I/O Charting
// ─────────────────────────────────────────────────────────────────────────────

export type VitalReading = {
    id: string
    admissionId: string
    timestamp: string // ISO string
    heartRate: number   // bpm
    spo2: number        // %
    temperature: number // °C
    respRate: number    // breaths/min
    bpSystolic: number
    bpDiastolic: number
    recordedBy: string
    notes?: string
}

export type IOType = "intake" | "output"
export type IORoute =
    | "Oral"
    | "IV Fluid"
    | "NG Tube"
    | "Urine"
    | "NG Aspirate"
    | "Drain"
    | "Other"

export type IOEntry = {
    id: string
    admissionId: string
    timestamp: string
    ioType: IOType
    route: IORoute
    volumeMl: number
    recordedBy: string
    notes?: string
}

// ─── Mock Vital Readings ───────────────────────────────────────────────────────
// 3 readings per admission over the past 6 hours for admitted admissions

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString()

export const mockVitalReadings: VitalReading[] = [
    // ADM-20260225-001 — Arya Sharma (PICU)
    {
        id: "VIT-001-1",
        admissionId: "ADM-20260225-001",
        timestamp: hoursAgo(6),
        heartRate: 145, spo2: 91, temperature: 38.7, respRate: 38, bpSystolic: 88, bpDiastolic: 58,
        recordedBy: "Nurse Rekha"
    },
    {
        id: "VIT-001-2",
        admissionId: "ADM-20260225-001",
        timestamp: hoursAgo(4),
        heartRate: 138, spo2: 93, temperature: 38.2, respRate: 34, bpSystolic: 90, bpDiastolic: 60,
        recordedBy: "Nurse Rekha"
    },
    {
        id: "VIT-001-3",
        admissionId: "ADM-20260225-001",
        timestamp: hoursAgo(2),
        heartRate: 130, spo2: 95, temperature: 37.9, respRate: 30, bpSystolic: 94, bpDiastolic: 62,
        recordedBy: "Nurse Priya"
    },
    {
        id: "VIT-001-4",
        admissionId: "ADM-20260225-001",
        timestamp: hoursAgo(0.5),
        heartRate: 124, spo2: 97, temperature: 37.5, respRate: 28, bpSystolic: 96, bpDiastolic: 64,
        recordedBy: "Nurse Priya",
        notes: "Patient more settled, breathing easier"
    },

    // ADM-20260224-002 — Saanvi Nair (General)
    {
        id: "VIT-002-1",
        admissionId: "ADM-20260224-002",
        timestamp: hoursAgo(5),
        heartRate: 110, spo2: 94, temperature: 37.8, respRate: 26, bpSystolic: 96, bpDiastolic: 62,
        recordedBy: "Nurse Anitha"
    },
    {
        id: "VIT-002-2",
        admissionId: "ADM-20260224-002",
        timestamp: hoursAgo(3),
        heartRate: 104, spo2: 96, temperature: 37.5, respRate: 24, bpSystolic: 98, bpDiastolic: 64,
        recordedBy: "Nurse Anitha"
    },
    {
        id: "VIT-002-3",
        admissionId: "ADM-20260224-002",
        timestamp: hoursAgo(1),
        heartRate: 98, spo2: 97, temperature: 37.2, respRate: 22, bpSystolic: 100, bpDiastolic: 66,
        recordedBy: "Nurse Priya",
        notes: "Post-nebulization. Saturation improved."
    },

    // ADM-20260223-003 — Aarav Singh (Surgery)
    {
        id: "VIT-003-1",
        admissionId: "ADM-20260223-003",
        timestamp: hoursAgo(4),
        heartRate: 92, spo2: 99, temperature: 36.9, respRate: 18, bpSystolic: 108, bpDiastolic: 70,
        recordedBy: "Nurse Sunitha"
    },
    {
        id: "VIT-003-2",
        admissionId: "ADM-20260223-003",
        timestamp: hoursAgo(2),
        heartRate: 88, spo2: 99, temperature: 36.8, respRate: 18, bpSystolic: 110, bpDiastolic: 72,
        recordedBy: "Nurse Sunitha",
        notes: "Pre-op prep complete. Patient fasting."
    },
]

// ─── Mock I/O Entries ─────────────────────────────────────────────────────────
export const mockIOEntries: IOEntry[] = [
    // ADM-20260225-001 — Arya Sharma
    {
        id: "IO-001-1", admissionId: "ADM-20260225-001",
        timestamp: hoursAgo(6), ioType: "intake", route: "IV Fluid", volumeMl: 200, recordedBy: "Nurse Rekha"
    },
    {
        id: "IO-001-2", admissionId: "ADM-20260225-001",
        timestamp: hoursAgo(5), ioType: "output", route: "Urine", volumeMl: 80, recordedBy: "Nurse Rekha"
    },
    {
        id: "IO-001-3", admissionId: "ADM-20260225-001",
        timestamp: hoursAgo(4), ioType: "intake", route: "IV Fluid", volumeMl: 200, recordedBy: "Nurse Rekha"
    },
    {
        id: "IO-001-4", admissionId: "ADM-20260225-001",
        timestamp: hoursAgo(2), ioType: "output", route: "Urine", volumeMl: 120, recordedBy: "Nurse Priya"
    },

    // ADM-20260224-002 — Saanvi Nair
    {
        id: "IO-002-1", admissionId: "ADM-20260224-002",
        timestamp: hoursAgo(5), ioType: "intake", route: "Oral", volumeMl: 150, recordedBy: "Nurse Anitha"
    },
    {
        id: "IO-002-2", admissionId: "ADM-20260224-002",
        timestamp: hoursAgo(3), ioType: "output", route: "Urine", volumeMl: 100, recordedBy: "Nurse Anitha"
    },
    {
        id: "IO-002-3", admissionId: "ADM-20260224-002",
        timestamp: hoursAgo(1), ioType: "intake", route: "Oral", volumeMl: 120, recordedBy: "Nurse Priya"
    },
]
