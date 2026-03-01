// lib/data/master-floors.ts
// Flat floor entities for the Master Data CRUD UI.
// NOTE: This is separate from mock-floors.ts which is used by the Bed Management visual grid.

export type MasterFloorStatus = "Active" | "Inactive"

export interface MasterFloor {
    id: string
    name: string
    floor_number: number
    status: MasterFloorStatus
    created_at: string
}

export const masterFloorsData: MasterFloor[] = [
    {
        id: "mf-001",
        name: "Ground Floor – Intensive Care",
        floor_number: 0,
        status: "Active",
        created_at: "2024-01-15",
    },
    {
        id: "mf-002",
        name: "1st Floor – General & Surgical",
        floor_number: 1,
        status: "Active",
        created_at: "2024-01-15",
    },
    {
        id: "mf-003",
        name: "2nd Floor – Private Suites",
        floor_number: 2,
        status: "Active",
        created_at: "2024-01-15",
    },
    {
        id: "mf-004",
        name: "3rd Floor – Observation",
        floor_number: 3,
        status: "Active",
        created_at: "2024-02-01",
    },
    {
        id: "mf-005",
        name: "4th Floor – Administrative",
        floor_number: 4,
        status: "Inactive",
        created_at: "2024-02-10",
    },
]
