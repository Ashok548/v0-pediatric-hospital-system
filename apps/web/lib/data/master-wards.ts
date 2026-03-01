// lib/data/master-wards.ts
// Flat ward data for Master Data CRUD UI.
// NOTE: Separate from the nested wards inside mock-floors.ts (used by Bed Management grid).

export type WardType = "General" | "Private" | "NICU" | "PICU"
export type WardStatus = "Active" | "Inactive"

export interface MasterWard {
    id: string
    floor_id: string
    name: string
    type: WardType
    total_beds: number
    status: WardStatus
    created_at: string
}

export const masterWardsData: MasterWard[] = [
    {
        id: "mw-001",
        floor_id: "mf-001",
        name: "Neonatal ICU",
        type: "NICU",
        total_beds: 15,
        status: "Active",
        created_at: "2024-01-15",
    },
    {
        id: "mw-002",
        floor_id: "mf-001",
        name: "Pediatric ICU",
        type: "PICU",
        total_beds: 10,
        status: "Active",
        created_at: "2024-01-15",
    },
    {
        id: "mw-003",
        floor_id: "mf-002",
        name: "General Ward – A",
        type: "General",
        total_beds: 20,
        status: "Active",
        created_at: "2024-01-16",
    },
    {
        id: "mw-004",
        floor_id: "mf-002",
        name: "Surgical Ward",
        type: "General",
        total_beds: 15,
        status: "Active",
        created_at: "2024-01-16",
    },
    {
        id: "mw-005",
        floor_id: "mf-003",
        name: "Private Suites – North",
        type: "Private",
        total_beds: 8,
        status: "Active",
        created_at: "2024-01-17",
    },
    {
        id: "mw-006",
        floor_id: "mf-003",
        name: "Private Suites – South",
        type: "Private",
        total_beds: 6,
        status: "Active",
        created_at: "2024-01-17",
    },
    {
        id: "mw-007",
        floor_id: "mf-004",
        name: "Observation Ward",
        type: "General",
        total_beds: 12,
        status: "Active",
        created_at: "2024-02-01",
    },
    {
        id: "mw-008",
        floor_id: "mf-002",
        name: "General Ward – B",
        type: "General",
        total_beds: 18,
        status: "Inactive",
        created_at: "2024-02-10",
    },
]
