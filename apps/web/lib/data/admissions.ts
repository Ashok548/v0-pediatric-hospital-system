// ─────────────────────────────────────────────────────────────────────────────
// lib/data/admissions.ts
// Mock data and types for the new Admission Workflow.
// ─────────────────────────────────────────────────────────────────────────────

export enum AdmissionStatus {
    DRAFT = "DRAFT",
    BED_ASSIGNED = "BED_ASSIGNED",
    ADMITTED = "ADMITTED",
    DISCHARGED = "DISCHARGED",
    CANCELLED = "CANCELLED"
}

export enum AdmissionType {
    EMERGENCY = "EMERGENCY",
    SCHEDULED = "SCHEDULED",
    REFERRAL = "REFERRAL"
}

export enum BedStatus {
    AVAILABLE = "AVAILABLE",
    OCCUPIED = "OCCUPIED",
    CLEANING = "CLEANING",
    RESERVED = "RESERVED"
}

export enum DischargeStatus {
    DRAFT = "DRAFT",
    UNDER_REVIEW = "UNDER_REVIEW",
    FINALIZED = "FINALIZED",
    LOCKED = "LOCKED"
}

export enum DischargeType {
    NORMAL = "NORMAL",
    LAMA = "LAMA",
    REFERRED = "REFERRED",
    EXPIRED = "EXPIRED"
}

export interface BedTransfer {
    id: string
    fromWardId: string
    fromBedId: string
    toWardId: string
    toBedId: string
    reason: string
    timestamp: string
}

export interface Admission {
    id: string
    patientId: string
    patientName: string
    status: AdmissionStatus
    admissionType: AdmissionType
    department: string
    admittingDoctorId: string
    admissionDateTime: string
    diagnosisNotes: string
    currentLocation?: {
        wardId: string
        wardName: string
        bedId: string
        bedNumber: string
    }
    transfers: BedTransfer[]
    discharge: any | null // Placeholder for discharge summary
}

export interface Bed {
    id: string
    number: string
    status: BedStatus
}

export interface Ward {
    id: string
    name: string
    type: string
    beds: Bed[]
}

// ─── End of Definitions ───────────────────────────────────────────────────────
