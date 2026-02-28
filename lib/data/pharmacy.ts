// ─────────────────────────────────────────────────────────────────────────────
// lib/data/pharmacy.ts
// Types and mock data for the Pharmacy Dispensing workflow
// ─────────────────────────────────────────────────────────────────────────────

export type PharmacyOrderStatus = "pending" | "dispensed" | "partial" | "returned"

export type PharmacyItem = {
    id: string
    drugName: string
    genericName: string
    form: "Tablet" | "Syrup" | "Injection" | "Nebulisation" | "Drops" | "Cream"
    strength: string      // e.g. "250mg", "5mg/5ml"
    prescribedQty: number
    unit: string          // e.g. "tablets", "ml", "vials"
    stockAvailable: number
    dispensedQty: number  // 0 until dispensed
    unitPrice: number     // ₹ per unit for billing
}

export type PharmacyOrder = {
    id: string
    prescriptionId: string
    admissionId: string   // links to IP billing
    patientId: string
    patientName: string
    doctorName: string
    wardBed: string
    status: PharmacyOrderStatus
    orderedAt: string     // ISO
    dispensedAt?: string
    dispensedBy?: string
    items: PharmacyItem[]
    notes?: string
}

// ─── Mock Pharmacy Orders ─────────────────────────────────────────────────────

export const mockPharmacyOrders: PharmacyOrder[] = [
    {
        id: "PHARM-001",
        prescriptionId: "RX-001",
        admissionId: "ADM-20260225-001",
        patientId: "CN-2026-0001",
        patientName: "Arya Sharma",
        doctorName: "Dr. Priya Reddy",
        wardBed: "Pediatric ICU / B-01",
        status: "pending",
        orderedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
        items: [
            {
                id: "ITEM-001-1", drugName: "Amikacin Injection", genericName: "Amikacin",
                form: "Injection", strength: "100mg/2ml",
                prescribedQty: 3, unit: "vials", stockAvailable: 12, dispensedQty: 0, unitPrice: 85
            },
            {
                id: "ITEM-001-2", drugName: "Dexamethasone Injection", genericName: "Dexamethasone",
                form: "Injection", strength: "4mg/ml",
                prescribedQty: 2, unit: "vials", stockAvailable: 8, dispensedQty: 0, unitPrice: 45
            },
            {
                id: "ITEM-001-3", drugName: "Salbutamol Nebulisation", genericName: "Salbutamol",
                form: "Nebulisation", strength: "2.5mg/2.5ml",
                prescribedQty: 6, unit: "units", stockAvailable: 25, dispensedQty: 0, unitPrice: 30
            },
        ]
    },
    {
        id: "PHARM-002",
        prescriptionId: "RX-002",
        admissionId: "ADM-20260224-002",
        patientId: "CN-2026-0005",
        patientName: "Saanvi Nair",
        doctorName: "Dr. Anil Kumar",
        wardBed: "General Pediatrics / G-01",
        status: "pending",
        orderedAt: new Date(Date.now() - 4 * 3600_000).toISOString(),
        items: [
            {
                id: "ITEM-002-1", drugName: "Budesonide Inhaler", genericName: "Budesonide",
                form: "Nebulisation", strength: "0.5mg/2ml",
                prescribedQty: 4, unit: "units", stockAvailable: 15, dispensedQty: 0, unitPrice: 55
            },
            {
                id: "ITEM-002-2", drugName: "Montelukast Syrup", genericName: "Montelukast",
                form: "Syrup", strength: "4mg/5ml",
                prescribedQty: 1, unit: "bottle", stockAvailable: 6, dispensedQty: 0, unitPrice: 120
            },
            {
                id: "ITEM-002-3", drugName: "Paracetamol Syrup", genericName: "Paracetamol",
                form: "Syrup", strength: "250mg/5ml",
                prescribedQty: 1, unit: "bottle", stockAvailable: 20, dispensedQty: 0, unitPrice: 35
            },
        ]
    },
    {
        id: "PHARM-003",
        prescriptionId: "RX-003",
        admissionId: "ADM-20260223-003",
        patientId: "CN-2026-0008",
        patientName: "Aarav Singh",
        doctorName: "Dr. Anil Kumar",
        wardBed: "General Pediatrics / G-02",
        status: "pending",
        orderedAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
        notes: "Pre-operative. Nil by mouth after midnight.",
        items: [
            {
                id: "ITEM-003-1", drugName: "Metronidazole IV", genericName: "Metronidazole",
                form: "Injection", strength: "500mg/100ml",
                prescribedQty: 3, unit: "bags", stockAvailable: 10, dispensedQty: 0, unitPrice: 110
            },
            {
                id: "ITEM-003-2", drugName: "Cefuroxime Injection", genericName: "Cefuroxime",
                form: "Injection", strength: "750mg",
                prescribedQty: 2, unit: "vials", stockAvailable: 8, dispensedQty: 0, unitPrice: 145
            },
        ]
    },
    {
        id: "PHARM-004",
        prescriptionId: "RX-004",
        admissionId: "ADM-20260222-004",
        patientId: "CN-2026-0012",
        patientName: "Reyansh Tiwari",
        doctorName: "Dr. Priya Reddy",
        wardBed: "Pediatric ICU / B-04",
        status: "dispensed",
        orderedAt: new Date(Date.now() - 10 * 3600_000).toISOString(),
        dispensedAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
        dispensedBy: "Pharmacist Ravi",
        items: [
            {
                id: "ITEM-004-1", drugName: "Regular Insulin", genericName: "Insulin",
                form: "Injection", strength: "100 IU/ml",
                prescribedQty: 2, unit: "vials", stockAvailable: 5, dispensedQty: 2, unitPrice: 180
            },
            {
                id: "ITEM-004-2", drugName: "Normal Saline 0.9%", genericName: "Sodium Chloride",
                form: "Injection", strength: "0.9%",
                prescribedQty: 4, unit: "bags", stockAvailable: 30, dispensedQty: 4, unitPrice: 65
            },
        ]
    },
]
