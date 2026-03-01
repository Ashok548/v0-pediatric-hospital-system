// lib/data/master-beds.ts
// Flat bed entities for Master Data CRUD UI.
// NOTE: Separate from mock-beds.ts / mock-floors.ts used by Bed Management visual grid.

export type MasterBedStatus = "Available" | "Occupied" | "Cleaning" | "Reserved" | "Maintenance"

export interface MasterBed {
    id: string
    ward_id: string
    bed_number: string
    status: MasterBedStatus
    created_at: string
}

// Helper to generate beds for a ward
function makeBeds(
    wardId: string,
    prefix: string,
    count: number,
    statuses?: Partial<Record<number, MasterBedStatus>>
): MasterBed[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `mb-${prefix}-${String(i + 1).padStart(2, "0")}`,
        ward_id: wardId,
        bed_number: `${prefix}-${String(i + 1).padStart(2, "0")}`,
        status: statuses?.[i] ?? (i < Math.floor(count * 0.6) ? "Occupied" : "Available"),
        created_at: "2024-01-20",
    }))
}

export const masterBedsData: MasterBed[] = [
    // NICU (mw-001) — 15 beds
    ...makeBeds("mw-001", "NICU", 15, { 10: "Cleaning", 11: "Maintenance" }),
    // PICU (mw-002) — 10 beds
    ...makeBeds("mw-002", "PICU", 10, { 8: "Reserved" }),
    // General Ward A (mw-003) — 20 beds
    ...makeBeds("mw-003", "GWA", 20, { 12: "Cleaning", 13: "Cleaning", 14: "Reserved", 19: "Maintenance" }),
    // Surgical Ward (mw-004) — 15 beds
    ...makeBeds("mw-004", "SRG", 15),
    // Private North (mw-005) — 8 beds
    ...makeBeds("mw-005", "PVN", 8, { 6: "Maintenance" }),
    // Private South (mw-006) — 6 beds
    ...makeBeds("mw-006", "PVS", 6),
    // Observation (mw-007) — 12 beds
    ...makeBeds("mw-007", "OBS", 12),
    // General Ward B (mw-008) — inactive ward, 18 beds maintenance
    ...Array.from({ length: 18 }, (_, i) => ({
        id: `mb-GWB-${String(i + 1).padStart(2, "0")}`,
        ward_id: "mw-008",
        bed_number: `GWB-${String(i + 1).padStart(2, "0")}`,
        status: "Maintenance" as MasterBedStatus,
        created_at: "2024-02-10",
    })),
]
