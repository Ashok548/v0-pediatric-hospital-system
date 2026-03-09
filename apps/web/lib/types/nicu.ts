// ─────────────────────────────────────────────────────────────────────────────
// lib/types/nicu.ts
// Type definitions for NICU Vitals and Growth Records API responses.
// ─────────────────────────────────────────────────────────────────────────────
import type { ApiAdmission } from "@/lib/types/admission"

// ─── NICU Vitals ──────────────────────────────────────────────────────────────
export interface ApiNicuVitals {
    id: string
    admissionId: string
    heartRate: number      // bpm
    spo2: number           // %
    temperature: number    // Celsius
    respiratoryRate?: number      // breaths/min
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    weight?: number        // kg
    notes?: string
    recordedAt: string     // ISO string
    recordedBy?: string    // user who recorded
    isCritical?: boolean
    alertMessage?: string | null
    acknowledgedAt?: string | null
    acknowledgedBy?: string | null
}

export interface CreateVitalsPayload {
    heartRate: number
    spo2: number
    temperature: number
    respiratoryRate?: number
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    weight?: number
    notes?: string
    recordedBy?: string
    isCritical?: boolean
    alertMessage?: string
}

// ─── NICU Admission (Admission + latest vitals snapshot) ─────────────────────
export interface ApiNicuAdmission extends ApiAdmission {
    vitalsRecords: ApiNicuVitals[]  // Only last 1 record from API
}

export interface PaginatedNicuAdmissions {
    data: ApiNicuAdmission[]
    total: number
    page: number
    limit: number
    totalPages: number
}

// ─── Growth Records ───────────────────────────────────────────────────────────
export interface ApiGrowthRecord {
    id: string
    patientId: string
    recordedAt: string
    recordedBy: string | null
    ageMonths: number
    weight: number | null
    height: number | null
    headCircumference: number | null
    notes: string | null
}

export interface CreateGrowthRecordPayload {
    ageMonths: number
    weight?: number
    height?: number
    headCircumference?: number
    notes?: string
}

// ─── NICU Critical Alerts ─────────────────────────────────────────────────────
export interface ApiNicuCriticalAlert {
    id: string
    vitalsId: string
    severity: 'CRITICAL' | 'WARNING'
    alertMessage: string
    recordedAt: string
    patient: {
        id: string
        uhid: string
        firstName: string
        lastName: string
    }
    currentBed: {
        bedNumber: string
        ward: { name: string }
    } | null
    vitals: ApiNicuVitals
}
