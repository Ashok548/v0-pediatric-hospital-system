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

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const mockWards: Ward[] = [
    {
        id: "WARD-PICU",
        name: "Pediatric ICU",
        type: "ICU",
        beds: [
            { id: "B1", number: "B-01", status: BedStatus.OCCUPIED },
            { id: "B2", number: "B-02", status: BedStatus.AVAILABLE },
            { id: "B3", number: "B-03", status: BedStatus.CLEANING },
            { id: "B4", number: "B-04", status: BedStatus.AVAILABLE },
        ]
    },
    {
        id: "WARD-GEN",
        name: "General Pediatrics",
        type: "General",
        beds: [
            { id: "G1", number: "G-01", status: BedStatus.AVAILABLE },
            { id: "G2", number: "G-02", status: BedStatus.AVAILABLE },
            { id: "G3", number: "G-03", status: BedStatus.RESERVED },
            { id: "G4", number: "G-04", status: BedStatus.OCCUPIED },
        ]
    }
]

export const mockAdmissions: Admission[] = [
    {
        id: "ADM-20260225-001",
        patientId: "CN-2026-0001",
        patientName: "Arya Sharma",
        status: AdmissionStatus.ADMITTED,
        admissionType: AdmissionType.EMERGENCY,
        department: "PICU",
        admittingDoctorId: "Dr. Priya Reddy",
        admissionDateTime: "2026-02-25T08:00:00Z",
        diagnosisNotes: "Severe respiratory distress",
        currentLocation: {
            wardId: "WARD-PICU",
            wardName: "Pediatric ICU",
            bedId: "B1",
            bedNumber: "B-01"
        },
        transfers: [],
        discharge: null
    },
    {
        id: "ADM-20260224-002",
        patientId: "CN-2026-0005",
        patientName: "Saanvi Nair",
        status: AdmissionStatus.ADMITTED,
        admissionType: AdmissionType.SCHEDULED,
        department: "General",
        admittingDoctorId: "Dr. Anil Kumar",
        admissionDateTime: "2026-02-24T10:30:00Z",
        diagnosisNotes: "Bronchial asthma — acute exacerbation",
        currentLocation: {
            wardId: "WARD-GEN",
            wardName: "General Pediatrics",
            bedId: "G1",
            bedNumber: "G-01"
        },
        transfers: [],
        discharge: null
    },
    {
        id: "ADM-20260223-003",
        patientId: "CN-2026-0008",
        patientName: "Aarav Singh",
        status: AdmissionStatus.ADMITTED,
        admissionType: AdmissionType.SCHEDULED,
        department: "Surgery",
        admittingDoctorId: "Dr. Anil Kumar",
        admissionDateTime: "2026-02-23T09:00:00Z",
        diagnosisNotes: "Appendicitis — pre-operative prep",
        currentLocation: {
            wardId: "WARD-GEN",
            wardName: "General Pediatrics",
            bedId: "G2",
            bedNumber: "G-02"
        },
        transfers: [],
        discharge: null
    },
    {
        id: "ADM-20260222-004",
        patientId: "CN-2026-0012",
        patientName: "Reyansh Tiwari",
        status: AdmissionStatus.BED_ASSIGNED,
        admissionType: AdmissionType.REFERRAL,
        department: "PICU",
        admittingDoctorId: "Dr. Priya Reddy",
        admissionDateTime: "2026-02-22T14:00:00Z",
        diagnosisNotes: "Diabetic Ketoacidosis — referred from district hospital",
        currentLocation: {
            wardId: "WARD-PICU",
            wardName: "Pediatric ICU",
            bedId: "B4",
            bedNumber: "B-04"
        },
        transfers: [],
        discharge: null
    },
    {
        id: "ADM-20260210-005",
        patientId: "CN-2026-0009",
        patientName: "Myra Joshi",
        status: AdmissionStatus.DISCHARGED,
        admissionType: AdmissionType.SCHEDULED,
        department: "General",
        admittingDoctorId: "Dr. Meera Iyer",
        admissionDateTime: "2026-02-10T11:00:00Z",
        diagnosisNotes: "Urinary tract infection — IV antibiotics course",
        currentLocation: undefined,
        transfers: [],
        discharge: {
            status: "LOCKED",
            type: "NORMAL",
            dischargeDateTime: "2026-02-18T14:00:00Z",
            summary: "Completed full antibiotic course. Discharged in stable condition."
        }
    }
]

// ─── Async API Mocks ──────────────────────────────────────────────────────────

export async function getWards(): Promise<Ward[]> {
    return mockWards
}

export async function getAdmissionById(id: string): Promise<Admission | null> {
    return mockAdmissions.find(a => a.id === id) || null
}

export async function getAvailableBeds(wardId: string): Promise<Bed[]> {
    const ward = mockWards.find(w => w.id === wardId)
    return ward ? ward.beds.filter(b => b.status === BedStatus.AVAILABLE) : []
}
