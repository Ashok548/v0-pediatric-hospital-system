// lib/data/master-services.ts

export type ServiceCategory = "Consultation" | "Lab" | "Procedure" | "Room" | "Misc"
export type ServiceStatus = "Active" | "Inactive"

export interface MasterService {
    id: string
    name: string
    category: ServiceCategory
    base_price: number
    tax_percent: number
    status: ServiceStatus
    created_at: string
}

export const masterServicesData: MasterService[] = [
    {
        id: "svc-001",
        name: "Pediatric OPD Consultation",
        category: "Consultation",
        base_price: 500,
        tax_percent: 0,
        status: "Active",
        created_at: "2024-01-10",
    },
    {
        id: "svc-002",
        name: "NICU Specialist Consultation",
        category: "Consultation",
        base_price: 1200,
        tax_percent: 0,
        status: "Active",
        created_at: "2024-01-10",
    },
    {
        id: "svc-003",
        name: "Complete Blood Count (CBC)",
        category: "Lab",
        base_price: 350,
        tax_percent: 18,
        status: "Active",
        created_at: "2024-01-12",
    },
    {
        id: "svc-004",
        name: "Blood Culture",
        category: "Lab",
        base_price: 900,
        tax_percent: 18,
        status: "Active",
        created_at: "2024-01-12",
    },
    {
        id: "svc-005",
        name: "Chest X-Ray",
        category: "Procedure",
        base_price: 600,
        tax_percent: 18,
        status: "Active",
        created_at: "2024-01-15",
    },
    {
        id: "svc-006",
        name: "USG Abdomen",
        category: "Procedure",
        base_price: 1400,
        tax_percent: 18,
        status: "Active",
        created_at: "2024-01-15",
    },
    {
        id: "svc-007",
        name: "ECG",
        category: "Procedure",
        base_price: 400,
        tax_percent: 18,
        status: "Active",
        created_at: "2024-01-15",
    },
    {
        id: "svc-008",
        name: "General Ward Bed (per day)",
        category: "Room",
        base_price: 1500,
        tax_percent: 12,
        status: "Active",
        created_at: "2024-01-18",
    },
    {
        id: "svc-009",
        name: "Private Room (per day)",
        category: "Room",
        base_price: 4500,
        tax_percent: 12,
        status: "Active",
        created_at: "2024-01-18",
    },
    {
        id: "svc-010",
        name: "NICU Bed (per day)",
        category: "Room",
        base_price: 6000,
        tax_percent: 12,
        status: "Active",
        created_at: "2024-01-18",
    },
    {
        id: "svc-011",
        name: "IV Line Setup",
        category: "Procedure",
        base_price: 250,
        tax_percent: 18,
        status: "Active",
        created_at: "2024-02-01",
    },
    {
        id: "svc-012",
        name: "Nebulization",
        category: "Procedure",
        base_price: 200,
        tax_percent: 18,
        status: "Active",
        created_at: "2024-02-01",
    },
    {
        id: "svc-013",
        name: "Ambulance Service",
        category: "Misc",
        base_price: 2000,
        tax_percent: 0,
        status: "Active",
        created_at: "2024-02-05",
    },
    {
        id: "svc-014",
        name: "Phototherapy (per day)",
        category: "Procedure",
        base_price: 1200,
        tax_percent: 12,
        status: "Inactive",
        created_at: "2024-02-10",
    },
]
