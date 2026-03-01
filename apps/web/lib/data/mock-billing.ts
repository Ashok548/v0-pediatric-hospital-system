// ─── Improvement #13 ──────────────────────────────────────────────────────────
// Expanded masterServices from 12 to 36 items across all categories.
// Improvement #7: IP bills now seeded from mockAdmissions to represent auto-creation.
// All items use new BillItem (no lineTotal).

import {
    PatientBill, BillWorkflowStatus, ChargeCategory,
    PaymentStatus, PaymentMode, generateInvoiceNo, computeLineTotal, BillItem
} from '../types/billing'
import { mockAdmissions, AdmissionStatus } from './admissions'

// ─── Master Service List (#13: expanded to 36 items) ─────────────────────────
export const masterServices: {
    id: string
    name: string
    category: ChargeCategory
    defaultPrice: number
    defaultTax: number
}[] = [
        // Consultation
        { id: 'SRV-C1', name: 'General Consultation', category: ChargeCategory.Consultation, defaultPrice: 800, defaultTax: 0 },
        { id: 'SRV-C2', name: 'Pediatrician Visit (Follow-up)', category: ChargeCategory.Consultation, defaultPrice: 600, defaultTax: 0 },
        { id: 'SRV-C3', name: 'Neonatologist Consultation', category: ChargeCategory.Consultation, defaultPrice: 1200, defaultTax: 0 },
        { id: 'SRV-C4', name: 'Surgical Consultation', category: ChargeCategory.Consultation, defaultPrice: 1000, defaultTax: 0 },
        { id: 'SRV-C5', name: 'Dietician Consultation', category: ChargeCategory.Consultation, defaultPrice: 500, defaultTax: 0 },

        // Lab
        { id: 'SRV-L1', name: 'CBC (Complete Blood Count)', category: ChargeCategory.Lab, defaultPrice: 600, defaultTax: 0 },
        { id: 'SRV-L2', name: 'CRP Test', category: ChargeCategory.Lab, defaultPrice: 800, defaultTax: 0 },
        { id: 'SRV-L3', name: 'Blood Culture', category: ChargeCategory.Lab, defaultPrice: 1400, defaultTax: 0 },
        { id: 'SRV-L4', name: 'Chest X-Ray (PA)', category: ChargeCategory.Lab, defaultPrice: 800, defaultTax: 5 },
        { id: 'SRV-L5', name: 'Serum Bilirubin', category: ChargeCategory.Lab, defaultPrice: 400, defaultTax: 0 },
        { id: 'SRV-L6', name: 'Complete Metabolic Panel', category: ChargeCategory.Lab, defaultPrice: 1200, defaultTax: 0 },
        { id: 'SRV-L7', name: 'Blood Gas Analysis', category: ChargeCategory.Lab, defaultPrice: 900, defaultTax: 0 },
        { id: 'SRV-L8', name: 'Urine Routine & Culture', category: ChargeCategory.Lab, defaultPrice: 500, defaultTax: 0 },

        // Procedure
        { id: 'SRV-P1', name: 'Phototherapy (per day)', category: ChargeCategory.Procedure, defaultPrice: 1500, defaultTax: 0 },
        { id: 'SRV-P2', name: 'Lumbar Puncture', category: ChargeCategory.Procedure, defaultPrice: 3500, defaultTax: 5 },
        { id: 'SRV-P3', name: 'Exchange Transfusion', category: ChargeCategory.Procedure, defaultPrice: 7500, defaultTax: 5 },
        { id: 'SRV-P4', name: 'Circumcision', category: ChargeCategory.Procedure, defaultPrice: 4000, defaultTax: 5 },
        { id: 'SRV-P5', name: 'Suturing (Minor Wound)', category: ChargeCategory.Procedure, defaultPrice: 1200, defaultTax: 5 },
        { id: 'SRV-P6', name: 'Appendectomy', category: ChargeCategory.Procedure, defaultPrice: 25000, defaultTax: 5 },

        // Room
        { id: 'SRV-R1', name: 'NICU Level 1 Bed (per day)', category: ChargeCategory.Room, defaultPrice: 3000, defaultTax: 0 },
        { id: 'SRV-R2', name: 'NICU Level 2 Bed (per day)', category: ChargeCategory.Room, defaultPrice: 5000, defaultTax: 0 },
        { id: 'SRV-R3', name: 'NICU Level 3 Bed (per day)', category: ChargeCategory.Room, defaultPrice: 8000, defaultTax: 0 },
        { id: 'SRV-R4', name: 'PICU Bed (per day)', category: ChargeCategory.Room, defaultPrice: 7000, defaultTax: 0 },
        { id: 'SRV-R5', name: 'General Ward Bed (per day)', category: ChargeCategory.Room, defaultPrice: 2000, defaultTax: 0 },
        { id: 'SRV-R6', name: 'Private Room (per day)', category: ChargeCategory.Room, defaultPrice: 4500, defaultTax: 0 },

        // Medicine
        { id: 'SRV-M1', name: 'IV Antibiotics (Amoxicillin)', category: ChargeCategory.Medicine, defaultPrice: 250, defaultTax: 5 },
        { id: 'SRV-M2', name: 'IV Antibiotics (Ceftriaxone)', category: ChargeCategory.Medicine, defaultPrice: 400, defaultTax: 5 },
        { id: 'SRV-M3', name: 'Paracetamol IV (100ml)', category: ChargeCategory.Medicine, defaultPrice: 120, defaultTax: 5 },
        { id: 'SRV-M4', name: 'Nebulizer Drug (Salbutamol)', category: ChargeCategory.Medicine, defaultPrice: 80, defaultTax: 5 },
        { id: 'SRV-M5', name: 'IVIG (per bottle)', category: ChargeCategory.Medicine, defaultPrice: 8000, defaultTax: 5 },

        // Nursing
        { id: 'SRV-N1', name: 'Nebulization Session', category: ChargeCategory.Nursing, defaultPrice: 300, defaultTax: 0 },
        { id: 'SRV-N2', name: 'IV Cannulation', category: ChargeCategory.Nursing, defaultPrice: 500, defaultTax: 0 },
        { id: 'SRV-N3', name: '24h Nursing Care', category: ChargeCategory.Nursing, defaultPrice: 1500, defaultTax: 0 },
        { id: 'SRV-N4', name: 'Wound Dressing (Minor)', category: ChargeCategory.Nursing, defaultPrice: 400, defaultTax: 0 },
        { id: 'SRV-N5', name: 'Nasogastric Tube Insertion', category: ChargeCategory.Nursing, defaultPrice: 600, defaultTax: 0 },

        // Misc
        { id: 'SRV-X1', name: 'OT Charges (Minor)', category: ChargeCategory.Misc, defaultPrice: 5000, defaultTax: 5 },
    ]

// ─── Helper to build a BillItem from a service ────────────────────────────────
export function makeBillItem(serviceId: string, quantity: number, discountPercent = 0): BillItem {
    const svc = masterServices.find(s => s.id === serviceId)
    if (!svc) throw new Error(`Unknown service: ${serviceId}`)
    return {
        id: `ITEM-${serviceId}-${Date.now()}`,
        serviceName: svc.name,
        category: svc.category,
        quantity,
        unitPrice: svc.defaultPrice,
        discountPercent,
        taxPercent: svc.defaultTax,
        dateAdded: new Date().toISOString()
    }
}

// ─── Helper to build a recalculated summary ───────────────────────────────────
export function recalcSummary(items: BillItem[], payments: { amount: number; status: PaymentStatus; isAdvance?: boolean }[]) {
    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    const totalDiscount = items.reduce((s, i) => s + (i.quantity * i.unitPrice * i.discountPercent / 100), 0)
    const totalTax = items.reduce((s, i) => {
        const discounted = (i.quantity * i.unitPrice) * (1 - i.discountPercent / 100)
        return s + discounted * i.taxPercent / 100
    }, 0)
    const netTotal = subtotal - totalDiscount + totalTax
    const totalPaid = payments.filter(p => p.status === PaymentStatus.Completed).reduce((s, p) => s + p.amount, 0)
    const totalRefunded = payments.filter(p => p.status === PaymentStatus.Refunded).reduce((s, p) => s + Math.abs(p.amount), 0)
    return { subtotal, totalDiscount, totalTax, netTotal, totalPaid, totalRefunded, balanceDue: netTotal - totalPaid + totalRefunded }
}

// ─── Seed IP Bills from admitted patients (#7) ─────────────────────────────────
const admittedAdmissions = mockAdmissions.filter(a =>
    a.status === AdmissionStatus.ADMITTED || a.status === AdmissionStatus.BED_ASSIGNED
)

const seedIpBills: PatientBill[] = admittedAdmissions.map((adm, idx): PatientBill => {
    const lengthOfStay = Math.max(1, Math.ceil(
        (Date.now() - new Date(adm.admissionDateTime).getTime()) / (1000 * 3600 * 24)
    ))

    const roomServiceId = adm.department === 'PICU' ? 'SRV-R4' : 'SRV-R5'
    const roomItem = makeBillItem(roomServiceId, lengthOfStay)
    const consultItem = makeBillItem('SRV-C1', 1)
    const items = [roomItem, consultItem]

    const advancePayment = {
        id: `ADV-SEED-${idx}`,
        amount: 5000,
        mode: 'UPI' as PaymentMode,
        status: PaymentStatus.Completed,
        date: adm.admissionDateTime,
        isAdvance: true,
        receiptNo: `REC-SEED-${1000 + idx}`
    }

    return {
        id: `BILL-IP-${adm.id}`,
        invoiceNumber: generateInvoiceNo('IP'),
        patientId: adm.patientId,
        patientName: adm.patientName,
        admissionId: adm.id,
        doctorName: adm.admittingDoctorId,
        department: adm.department,
        wardName: adm.currentLocation?.wardName,
        bedNumber: adm.currentLocation?.bedNumber,
        type: 'IP',
        status: BillWorkflowStatus.Running,
        date: adm.admissionDateTime,
        items,
        payments: [advancePayment],
        summary: recalcSummary(items, [advancePayment])
    }
})

// ─── Additional OP bill for demo ──────────────────────────────────────────────
const opItems = [makeBillItem('SRV-C1', 1), makeBillItem('SRV-L1', 1)]
const opPayments = [{ id: 'PAY-OP-1', amount: 0, mode: 'Cash' as PaymentMode, status: PaymentStatus.Pending, date: new Date().toISOString() }]

const seedOpBill: PatientBill = {
    id: 'BILL-OP-DEMO',
    invoiceNumber: generateInvoiceNo('OP'),
    patientId: 'UHID-10025',
    patientName: 'Ishaan Verma',
    visitId: 'VIS-2026-0099',
    doctorName: 'Dr. Meera Iyer',
    department: 'Pediatrics',
    type: 'OP',
    status: BillWorkflowStatus.Draft,
    date: new Date().toISOString(),
    items: opItems,
    payments: [],
    summary: recalcSummary(opItems, [])
}

export const mockBills: PatientBill[] = [...seedIpBills, seedOpBill]
