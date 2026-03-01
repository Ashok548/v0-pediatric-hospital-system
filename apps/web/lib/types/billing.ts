// ─── Billing Module Types ─────────────────────────────────────────────────────
// Round 1: PaymentMode, Voided, computeLineTotal, invoiceNumber
// Round 2: editHistory, discountReason, wardName/bedNumber, CreditNote, localStorage counter

export enum BillWorkflowStatus {
    Draft = 'DRAFT',
    Running = 'RUNNING',
    PendingSettlement = 'PENDING_SETTLEMENT',
    Closed = 'CLOSED',
    Voided = 'VOIDED'
}

export enum PaymentStatus {
    Pending = 'PENDING',
    Completed = 'COMPLETED',
    Refunded = 'REFUNDED'
}

export enum ChargeCategory {
    Consultation = 'CONSULTATION',
    Lab = 'LAB',
    Procedure = 'PROCEDURE',
    Room = 'ROOM',
    Medicine = 'MEDICINE',
    Nursing = 'NURSING',
    Misc = 'MISC'
}

export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Online'

// ─── #4: Audit trail for line item edits ──────────────────────────────────────
export interface ItemEditEntry {
    field: string
    oldValue: string
    newValue: string
    timestamp: string
}

export interface BillItem {
    id: string
    serviceName: string
    category: ChargeCategory
    quantity: number
    unitPrice: number
    discountPercent: number
    taxPercent: number
    dateAdded?: string
    // #6: Discount authorization
    discountReason?: string
    discountApprovedBy?: string
    // #4: Edit audit trail
    editHistory?: ItemEditEntry[]
}

/** Derive line total from a BillItem without storing it */
export function computeLineTotal(item: BillItem): number {
    const gross = item.quantity * item.unitPrice
    const discounted = gross * (1 - item.discountPercent / 100)
    return discounted * (1 + item.taxPercent / 100)
}

export interface BillPayment {
    id: string
    amount: number
    mode: PaymentMode
    status: PaymentStatus
    date: string
    isAdvance?: boolean
    receiptNo?: string
    note?: string
}

export interface BillSummary {
    subtotal: number
    totalDiscount: number
    totalTax: number
    netTotal: number
    totalPaid: number
    totalRefunded: number
    balanceDue: number
}

// ─── #2: Credit Note for post-close corrections ──────────────────────────────
export interface CreditNote {
    id: string
    originalInvoiceNo: string
    reason: string
    items: BillItem[]
    amount: number              // total credit issued
    issuedAt: string
    issuedBy?: string
}

// ─── #12: Persist invoice counter in localStorage ─────────────────────────────
const COUNTER_KEY = 'billing_invoice_counter'

function getCounter(): number {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(COUNTER_KEY)
        if (stored) return parseInt(stored, 10)
    }
    return 1000
}

function setCounter(val: number) {
    if (typeof window !== 'undefined') {
        localStorage.setItem(COUNTER_KEY, String(val))
    }
}

let _invoiceCounter = getCounter()

export function generateInvoiceNo(type: 'OP' | 'IP'): string {
    _invoiceCounter++
    setCounter(_invoiceCounter)
    return `${type}/2026/${String(_invoiceCounter).padStart(5, '0')}`
}

// ─── PatientBill ──────────────────────────────────────────────────────────────
export interface PatientBill {
    id: string
    invoiceNumber: string
    patientId: string
    patientName?: string
    admissionId?: string
    visitId?: string
    doctorName?: string
    department?: string
    // #3/#7: Bed/ward info from admission
    wardName?: string
    bedNumber?: string
    type: 'OP' | 'IP'
    status: BillWorkflowStatus
    date: string
    closedAt?: string
    items: BillItem[]
    payments: BillPayment[]
    summary: BillSummary
    // #2: Credit notes issued against this bill
    creditNotes?: CreditNote[]
}
