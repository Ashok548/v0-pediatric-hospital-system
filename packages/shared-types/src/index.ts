// ─────────────────────────────────────────────────────────────────────────────
// lib/data/types.ts
// Shared TypeScript types used across all data service modules.
// These are the contracts that your API will honour when you migrate later.
// ─────────────────────────────────────────────────────────────────────────────

/** Gender used across all patient records */
export type Gender = "M" | "F"

/** High-level patient ward status */
export type PatientStatus = "OP" | "IP" | "NICU" | "Discharged"

/** Payment status for billing */
export type BillStatus = "Paid" | "Pending" | "Partial" | "Overdue"

/** Payment mode */
export type PaymentMode = "Cash" | "Card" | "UPI" | "Insurance"

/** Appointment status */
export type ApptStatus = "Scheduled" | "Completed" | "In Progress" | "Cancelled" | "No Show"

/** NICU baby status */
export type BabyStatus = "critical" | "warning" | "stable"

/** Core patient record (list-level, no clinical details) */
export interface Patient {
    uhid: string
    firstName: string
    lastName: string
    ageYears: number
    ageMonths: number
    gender: Gender
    guardianName: string
    status: PatientStatus
    doctor: string
    lastModified: Date
    phone: string
    wardBed?: string
}

/** Extended patient record used in the Patient Detail Hub */
export interface PatientDetail {
    uhid: string
    name: string
    dob: string
    age: string
    gender: Gender
    bloodGroup: string
    weight: string
    guardian: string
    phone: string
    doctor: string
    status: PatientStatus
    wardBed?: string
    diagnosis: string
    admissionDate?: string
}

/** Single appointment */
export interface Appointment {
    id: string
    patientId: string     // DB patient UUID — used for OP visit creation
    patientName: string
    uhid: string
    age: string
    gender: Gender
    doctor: string
    doctorId: string
    department: string
    appointmentDate: string
    time: string
    duration: number // minutes
    status: ApptStatus
    type: string
    token: number
    notes?: string
    chiefComplaint?: string
}

/** Single invoice / bill */
export interface Bill {
    id: string
    invoiceNo: string
    patientName: string
    uhid: string
    gender: Gender
    department: string
    services: string[]
    totalAmount: number
    paidAmount: number
    status: BillStatus
    paymentMode?: PaymentMode
    date: string
    doctor: string
}

/** Vaccination patient (dashboard list) */
export interface VaccinationPatient {
    id: string
    name: string
    age: string
    gender: Gender
    dob: string
    doctor: string
    lastVisit: string
    nextDue: string
    nextVaccine: string
    vaccinesGiven: number
    totalVaccines: number
    status: "up-to-date" | "due-today" | "overdue" | "upcoming"
}

/** NICU baby */
export interface NicuBaby {
    id: string
    name: string
    bed: string
    gestationalAge: string
    weight: string
    status: BabyStatus
    vitals: { heartRate: number; spo2: number; temperature: number }
    alerts: string[]
    admittedDate: string
    doctor: string
}

/** Reports KPI */
export interface ReportKpi {
    label: string
    value: string | number
    change: string
    positive: boolean
}

/** API response wrapper — use this shape when you migrate to real APIs */
export interface ApiResponse<T> {
    data: T
    total?: number
    page?: number
    pageSize?: number
    error?: string
}
