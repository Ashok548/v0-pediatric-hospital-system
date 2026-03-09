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

// ─── Types Only ──────────────────────────────────────────────────────────────
