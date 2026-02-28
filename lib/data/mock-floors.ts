export type BedStatus = "Available" | "Occupied" | "Cleaning" | "Reserved" | "Maintenance"
export type NicuRiskLevel = "LOW" | "MODERATE" | "HIGH"
export type WardType = "NICU" | "PICU" | "General" | "Surgical" | "Private"

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
    type: WardType
    totalBeds: number
    beds: Bed[]
}

export interface Floor {
    id: string
    name: string
    wards: Ward[]
}

// Deterministic past date based on a fixed offset in hours (no Math.random)
const getPastDate = (hoursAgo: number) => {
    return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
}

// Deterministic gestational age based on index
const getGestationalAge = (i: number) => `${30 + (i % 8)} Weeks`

export const initialFloors: Floor[] = [
    {
        id: "F-GROUND",
        name: "Ground Floor - Intensive Care",
        wards: [
            {
                id: "W-NICU",
                name: "Neonatal ICU",
                type: "NICU",
                totalBeds: 15,
                beds: Array.from({ length: 15 }).map((_, i) => ({
                    id: `B-NICU-${String(i + 1).padStart(2, "0")}`,
                    status: i < 10 ? "Occupied" : i === 10 ? "Cleaning" : "Available",
                    patientName: i < 10 ? `Baby of Mother ${i + 1}` : undefined,
                    admissionId: i < 10 ? `ADM-2026-30${i}` : undefined,
                    nicuData: i < 10 ? {
                        babyName: `Baby ${i + 1}`,
                        gestationalAge: getGestationalAge(i),
                        riskLevel: i < 2 ? "HIGH" : i < 6 ? "MODERATE" : "LOW"
                    } : undefined,
                    history: i < 10 ? [{ action: "ASSIGNED", timestamp: getPastDate((i + 1) * 6) }] : []
                }))
            },
            {
                id: "W-PICU",
                name: "Pediatric ICU",
                type: "PICU",
                totalBeds: 10,
                beds: Array.from({ length: 10 }).map((_, i) => ({
                    id: `B-PICU-${String(i + 1).padStart(2, "0")}`,
                    status: i < 8 ? "Occupied" : i === 8 ? "Reserved" : "Available",
                    patientName: i < 8 ? `PICU Patient ${i + 1}` : undefined,
                    admissionId: i < 8 ? `ADM-2026-20${i}` : undefined,
                    history: i < 8 ? [{ action: "ASSIGNED", timestamp: getPastDate((i + 1) * 4) }] : []
                }))
            }
        ]
    },
    {
        id: "F-FIRST",
        name: "1st Floor - General & Surgical",
        wards: [
            {
                id: "W-GEN",
                name: "General Ward",
                type: "General",
                totalBeds: 20,
                beds: Array.from({ length: 20 }).map((_, i) => ({
                    id: `B-GEN-${String(i + 1).padStart(2, "0")}`,
                    status: i < 12 ? "Occupied" : i < 15 ? "Cleaning" : i === 15 ? "Reserved" : i === 19 ? "Maintenance" : "Available",
                    patientName: i < 12 ? `Patient ${i + 1}` : undefined,
                    admissionId: i < 12 ? `ADM-2026-10${i}` : undefined,
                    history: i < 12 ? [{ action: "ASSIGNED", timestamp: getPastDate((i + 1) * 3) }] : []
                }))
            },
            {
                id: "W-SURG",
                name: "Surgical Ward",
                type: "Surgical",
                totalBeds: 15,
                beds: Array.from({ length: 15 }).map((_, i) => ({
                    id: `B-SURG-${String(i + 1).padStart(2, "0")}`,
                    status: i < 5 ? "Occupied" : i < 7 ? "Available" : i < 10 ? "Cleaning" : "Available",
                    patientName: i < 5 ? `Surg Patient ${i + 1}` : undefined,
                    admissionId: i < 5 ? `ADM-2026-40${i}` : undefined,
                    history: i < 5 ? [{ action: "ASSIGNED", timestamp: getPastDate((i + 1) * 5) }] : []
                }))
            }
        ]
    },
    {
        id: "F-SECOND",
        name: "2nd Floor - Private Suites",
        wards: [
            {
                id: "W-PRIV",
                name: "Private Rooms",
                type: "Private",
                totalBeds: 12,
                beds: Array.from({ length: 12 }).map((_, i) => ({
                    id: `B-PRIV-${String(i + 1).padStart(2, "0")}`,
                    status: i < 6 ? "Occupied" : i === 6 ? "Maintenance" : "Available",
                    patientName: i < 6 ? `Private Patient ${i + 1}` : undefined,
                    admissionId: i < 6 ? `ADM-2026-50${i}` : undefined,
                    history: i < 6 ? [{ action: "ASSIGNED", timestamp: getPastDate((i + 1) * 8) }] : []
                }))
            }
        ]
    }
]
