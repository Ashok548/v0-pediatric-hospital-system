// ─────────────────────────────────────────────────────────────────────────────
// lib/types/nicu.ts
// Type definitions for NICU Vitals and Growth Records API responses.
// ─────────────────────────────────────────────────────────────────────────────
import type { ApiAdmission } from "@/lib/types/admission"

// ─── NICU Vitals ──────────────────────────────────────────────────────────────
export interface ApiNicuVitals {
    id: string
    admissionId: string
    recordedAt: string
    recordedBy: string | null
    heartRate: number | null
    spo2: number | null
    temperature: number | null
    respiratoryRate: number | null
    bloodPressureSystolic: number | null
    bloodPressureDiastolic: number | null
    weight: number | null
    notes: string | null
}

export interface CreateVitalsPayload {
    heartRate?: number
    spo2?: number
    temperature?: number
    respiratoryRate?: number
    bloodPressureSystolic?: number
    bloodPressureDiastolic?: number
    weight?: number
    notes?: string
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
