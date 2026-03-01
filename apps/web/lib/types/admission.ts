// ─────────────────────────────────────────────────────────────────────────────
// lib/types/admission.ts
// API response shapes that match the NestJS AdmissionsService output.
// These replace the local mock types from lib/data/admissions.ts for API usage.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums (mirrored from Prisma schema) ─────────────────────────────────────
export type AdmissionStatus = "DRAFT" | "BED_ASSIGNED" | "ADMITTED" | "DISCHARGED" | "CANCELLED"
export type AdmissionType = "EMERGENCY" | "SCHEDULED" | "REFERRAL"
export type AdmissionPriority = "CRITICAL" | "HIGH" | "NORMAL"
export type BedStatusType = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED" | "MAINTENANCE"
export type WardTypeType = "GENERAL" | "PRIVATE" | "NICU" | "PICU" | "SURGICAL"
export type DischargeType = "NORMAL" | "LAMA" | "REFERRED" | "EXPIRED"

// ─── Nested API Shapes ────────────────────────────────────────────────────────
export interface ApiFloor {
    id: string
    name: string
    floorNumber: number
    status: "ACTIVE" | "INACTIVE"
}

export interface ApiWard {
    id: string
    name: string
    type: WardTypeType
    totalBeds: number
    status: "ACTIVE" | "INACTIVE"
    floorId: string
    floor: Pick<ApiFloor, "id" | "name">
}

export interface ApiBed {
    id: string
    bedNumber: string
    status: BedStatusType
    wardId: string
    ward: Pick<ApiWard, "id" | "name" | "type"> & {
        floor: Pick<ApiFloor, "id" | "name">
    }
}

/** Full ward with beds — used in Bed Management tree */
export interface ApiWardWithBeds extends ApiWard {
    beds: ApiBed[]
}

/** Full floor with nested wards and beds — used in Bed Management tree */
export interface ApiFloorWithWards {
    id: string
    name: string
    floorNumber: number
    status: "ACTIVE" | "INACTIVE"
    wards: ApiWardWithBeds[]
}

export interface ApiPatientSummary {
    id: string
    uhid: string
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    phone: string
    guardianName: string
}

export interface ApiBedTransfer {
    id: string
    admissionId: string
    fromBedId: string | null
    toBedId: string | null
    reason: string | null
    transferDate: string
    transferredBy: string | null
    fromBed: { id: string; bedNumber: string } | null
    toBed: { id: string; bedNumber: string } | null
}

export interface ApiAdmission {
    id: string
    admissionNumber: string
    patientId: string
    patient: ApiPatientSummary
    status: AdmissionStatus
    admissionType: AdmissionType
    priority: AdmissionPriority
    department: string
    admittingDoctorId: string | null
    admittingDoctor: { id: string; name: string } | null
    admissionDate: string
    expectedDischarge: string | null
    initialDiagnosis: string | null
    currentBedId: string | null
    currentBed: ApiBed | null
    // NICU
    gestationalAge: string | null
    nicuRiskLevel: string | null
    // Discharge clearance (multi-step with full audit)
    dischargeStatus: string | null
    dischargeType: string | null
    clinicalCleared: boolean
    clinicalNote: string | null
    clinicalClearedAt: string | null
    clinicalClearedBy: string | null
    pharmacyCleared: boolean
    pharmacyClearedAt: string | null
    pharmacyClearedBy: string | null
    billingCleared: boolean
    billingClearedAt: string | null
    billingClearedBy: string | null
    dischargeDate: string | null
    dischargeSummary: string | null
    transfers: ApiBedTransfer[]
    createdAt: string
    updatedAt: string
}

// ─── Paginated Response ───────────────────────────────────────────────────────
export interface PaginatedAdmissions {
    data: ApiAdmission[]
    total: number
    page: number
    limit: number
    totalPages: number
}

// ─── Request DTOs ─────────────────────────────────────────────────────────────
export interface CreateAdmissionPayload {
    patientId: string
    admissionType: AdmissionType
    priority?: AdmissionPriority
    department: string
    admittingDoctorId?: string
    admissionDate: string
    expectedDischarge?: string
    initialDiagnosis?: string
    bedId?: string
    gestationalAge?: string
    nicuRiskLevel?: string
}

export interface BedTransferPayload {
    toBedId: string
    reason?: string
}

export interface DischargeClearancePayload {
    step: "clinical" | "pharmacy" | "billing"
    note?: string
}

export interface FinalizeDischargePayload {
    dischargeType: DischargeType
    dischargeSummary?: string
}

export interface AdmissionsQuery {
    status?: AdmissionStatus
    search?: string
    department?: string
    patientId?: string
    page?: number
    limit?: number
}
