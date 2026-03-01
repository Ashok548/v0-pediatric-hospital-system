// lib/data/master-departments.ts

export type DepartmentStatus = "Active" | "Inactive"

export interface Department {
    id: string
    name: string
    description: string
    status: DepartmentStatus
    created_at: string
}

export const masterDepartmentsData: Department[] = [
    {
        id: "dept-001",
        name: "Pediatric ICU",
        description: "Intensive care for critically ill children requiring constant monitoring.",
        status: "Active",
        created_at: "2024-01-10",
    },
    {
        id: "dept-002",
        name: "Neonatal ICU",
        description: "Specialized care for premature and seriously ill newborns.",
        status: "Active",
        created_at: "2024-01-10",
    },
    {
        id: "dept-003",
        name: "General Pediatrics",
        description: "Outpatient and inpatient care for general childhood illnesses.",
        status: "Active",
        created_at: "2024-01-12",
    },
    {
        id: "dept-004",
        name: "Pediatric Surgery",
        description: "Surgical procedures for infants, children, and adolescents.",
        status: "Active",
        created_at: "2024-01-12",
    },
    {
        id: "dept-005",
        name: "Pediatric Cardiology",
        description: "Diagnosis and treatment of heart conditions in children.",
        status: "Active",
        created_at: "2024-01-15",
    },
    {
        id: "dept-006",
        name: "Radiology & Imaging",
        description: "Diagnostic imaging services including X-ray, ultrasound and MRI.",
        status: "Active",
        created_at: "2024-01-15",
    },
    {
        id: "dept-007",
        name: "Pathology & Laboratory",
        description: "Clinical laboratory services for diagnostic testing.",
        status: "Active",
        created_at: "2024-01-18",
    },
    {
        id: "dept-008",
        name: "Physiotherapy",
        description: "Rehabilitation and physical therapy for pediatric patients.",
        status: "Active",
        created_at: "2024-02-01",
    },
    {
        id: "dept-009",
        name: "Dietetics & Nutrition",
        description: "Nutritional guidance and therapeutic diet planning.",
        status: "Inactive",
        created_at: "2024-02-05",
    },
    {
        id: "dept-010",
        name: "Child Psychiatry",
        description: "Mental health services for children and adolescents.",
        status: "Active",
        created_at: "2024-02-10",
    },
]
