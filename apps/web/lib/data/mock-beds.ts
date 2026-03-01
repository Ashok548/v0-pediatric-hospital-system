export type BedStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED" | "MAINTENANCE"
export type NicuRiskLevel = "LOW" | "MODERATE" | "HIGH"

export interface ActivityLog {
    action: string
    timestamp: string
    details?: string
}

export interface Bed {
    id: string
    status: BedStatus
    patientName?: string
    admissionId?: string
    nicuData?: {
        babyName: string
        gestationalAge: string
        riskLevel: NicuRiskLevel
    }
    history: ActivityLog[]
}

export interface Ward {
    id: string
    name: string
    totalBeds: number
    beds: Bed[]
}

export const initialWards: Ward[] = [
    {
        id: "W-GEN",
        name: "General Ward",
        totalBeds: 20,
        beds: Array.from({ length: 20 }).map((_, i) => ({
            id: `B-GEN-${String(i + 1).padStart(2, "0")}`,
            status: i < 12 ? "OCCUPIED" : i < 15 ? "CLEANING" : i === 15 ? "RESERVED" : i === 19 ? "MAINTENANCE" : "AVAILABLE",
            patientName: i < 12 ? `Patient ${i + 1}` : undefined,
            admissionId: i < 12 ? `ADM-2026-10${i}` : undefined,
            history: i < 12 ? [{ action: "ASSIGNED", timestamp: new Date(Date.now() - Math.random() * 100000000).toISOString() }] : []
        }))
    },
    {
        id: "W-PICU",
        name: "PICU",
        totalBeds: 10,
        beds: Array.from({ length: 10 }).map((_, i) => ({
            id: `B-PICU-${String(i + 1).padStart(2, "0")}`,
            status: i < 8 ? "OCCUPIED" : "AVAILABLE",
            patientName: i < 8 ? `PICU Patient ${i + 1}` : undefined,
            admissionId: i < 8 ? `ADM-2026-20${i}` : undefined,
            history: i < 8 ? [{ action: "ASSIGNED", timestamp: new Date(Date.now() - Math.random() * 100000000).toISOString() }] : []
        }))
    },
    {
        id: "W-NICU",
        name: "NICU",
        totalBeds: 15,
        beds: Array.from({ length: 15 }).map((_, i) => ({
            id: `B-NICU-${String(i + 1).padStart(2, "0")}`,
            status: i < 10 ? "OCCUPIED" : i === 10 ? "CLEANING" : "AVAILABLE",
            patientName: i < 10 ? `Baby of Mother ${i + 1}` : undefined,
            admissionId: i < 10 ? `ADM-2026-30${i}` : undefined,
            nicuData: i < 10 ? {
                babyName: `Baby ${i + 1}`,
                gestationalAge: `${30 + Math.floor(Math.random() * 8)} Weeks`,
                riskLevel: i < 2 ? "HIGH" : i < 6 ? "MODERATE" : "LOW"
            } : undefined,
            history: i < 10 ? [{ action: "ASSIGNED", timestamp: new Date(Date.now() - Math.random() * 100000000).toISOString() }] : []
        }))
    },
    {
        id: "W-SURG",
        name: "Surgical Ward",
        totalBeds: 15,
        beds: Array.from({ length: 15 }).map((_, i) => ({
            id: `B-SURG-${String(i + 1).padStart(2, "0")}`,
            status: i < 5 ? "OCCUPIED" : i < 7 ? "AVAILABLE" : i < 10 ? "CLEANING" : "AVAILABLE",
            patientName: i < 5 ? `Surg Patient ${i + 1}` : undefined,
            admissionId: i < 5 ? `ADM-2026-40${i}` : undefined,
            history: i < 5 ? [{ action: "ASSIGNED", timestamp: new Date(Date.now() - Math.random() * 100000000).toISOString() }] : []
        }))
    }
]
