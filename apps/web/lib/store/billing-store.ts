// ─── Billing Store — No Dependencies ──────────────────────────────────────────
// #17: Removed Zustand dependency (using useSyncExternalStore)
// Fully reactive using a simple Observer pattern.

import { useSyncExternalStore } from 'react'
import {
    PatientBill, BillWorkflowStatus, BillItem,
    BillPayment, PaymentStatus, PaymentMode, CreditNote,
    ItemEditEntry, generateInvoiceNo
} from '../types/billing'
import { mockBills, recalcSummary } from '../data/mock-billing'

// ─── Observable Internal State ───────────────────────────────────────────────
let state: PatientBill[] = [...mockBills]
const listeners = new Set<() => void>()

function subscribe(callback: () => void) {
    listeners.add(callback)
    return () => listeners.delete(callback)
}

function emit() {
    state = [...state] // Immutable-ish update
    listeners.forEach(l => l())
}

const isEditable = (status: BillWorkflowStatus) =>
    status !== BillWorkflowStatus.Closed && status !== BillWorkflowStatus.Voided

// ─── Actions ──────────────────────────────────────────────────────────────────
// These mirror the previous Zustand actions but mutate the local `state` array.

export const billingActions = {
    getBills: () => state,

    // OP Actions
    createOpBill: (patientId: string, patientName: string, visitId?: string, doctorName?: string, department?: string): string | null => {
        if (visitId) {
            const existing = state.find(b =>
                b.visitId === visitId &&
                (b.status === BillWorkflowStatus.Draft || b.status === BillWorkflowStatus.Closed)
            )
            if (existing) return null
        }

        const id = `BILL-OP-${Date.now()}`
        const newBill: PatientBill = {
            id,
            invoiceNumber: generateInvoiceNo('OP'),
            patientId,
            patientName,
            visitId,
            doctorName,
            department,
            type: 'OP',
            status: BillWorkflowStatus.Draft,
            date: new Date().toISOString(),
            items: [],
            payments: [],
            summary: { subtotal: 0, totalDiscount: 0, totalTax: 0, netTotal: 0, totalPaid: 0, totalRefunded: 0, balanceDue: 0 }
        }
        state.push(newBill)
        emit()
        return id
    },

    addItemToBill: (billId: string, item: BillItem) => {
        state = state.map(b => {
            if (b.id !== billId || !isEditable(b.status)) return b
            const items = [...b.items, item]
            return { ...b, items, summary: recalcSummary(items, b.payments) }
        })
        emit()
    },

    removeItemFromBill: (billId: string, itemId: string) => {
        state = state.map(b => {
            if (b.id !== billId || !isEditable(b.status)) return b
            const items = b.items.filter(i => i.id !== itemId)
            return { ...b, items, summary: recalcSummary(items, b.payments) }
        })
        emit()
    },

    updateItemInBill: (billId: string, updatedItem: BillItem, changes?: { field: string; oldVal: string; newVal: string }[]) => {
        state = state.map(b => {
            if (b.id !== billId || !isEditable(b.status)) return b
            const items = b.items.map(i => {
                if (i.id !== updatedItem.id) return i
                const newHistory: ItemEditEntry[] = (changes ?? []).map(c => ({
                    field: c.field,
                    oldValue: c.oldVal,
                    newValue: c.newVal,
                    timestamp: new Date().toISOString()
                }))
                return {
                    ...updatedItem,
                    editHistory: [...(i.editHistory ?? []), ...newHistory]
                }
            })
            return { ...b, items, summary: recalcSummary(items, b.payments) }
        })
        emit()
    },

    addPaymentToBill: (billId: string, payment: BillPayment): { success: boolean; error?: string } => {
        const bill = state.find(b => b.id === billId)
        if (!bill || !isEditable(bill.status)) return { success: false, error: 'Bill not editable' }
        if (payment.amount <= 0) return { success: false, error: 'Amount must be positive' }
        if (payment.amount > bill.summary.balanceDue) {
            return { success: false, error: `Amount exceeds balance due (₹${bill.summary.balanceDue.toFixed(0)})` }
        }

        state = state.map(b => {
            if (b.id !== billId) return b
            const payments = [...b.payments, payment]
            return { ...b, payments, summary: recalcSummary(b.items, payments) }
        })
        emit()
        return { success: true }
    },

    voidBill: (billId: string) => {
        state = state.map(b => {
            if (b.id !== billId || b.status !== BillWorkflowStatus.Draft) return b
            return { ...b, status: BillWorkflowStatus.Voided, closedAt: new Date().toISOString() }
        })
        emit()
    },

    closeBill: (billId: string) => {
        state = state.map(b => {
            if (b.id !== billId || !isEditable(b.status)) return b
            return { ...b, status: BillWorkflowStatus.Closed, closedAt: new Date().toISOString() }
        })
        emit()
    },

    createIpBill: (admissionId: string, patientId: string, patientName: string, doctorName?: string, department?: string, wardName?: string, bedNumber?: string): string => {
        const existing = state.find(b => b.admissionId === admissionId)
        if (existing) return existing.id

        const id = `BILL-IP-${admissionId}`
        const newBill: PatientBill = {
            id,
            invoiceNumber: generateInvoiceNo('IP'),
            patientId,
            patientName,
            admissionId,
            doctorName,
            department,
            wardName,
            bedNumber,
            type: 'IP',
            status: BillWorkflowStatus.Running,
            date: new Date().toISOString(),
            items: [],
            payments: [],
            summary: { subtotal: 0, totalDiscount: 0, totalTax: 0, netTotal: 0, totalPaid: 0, totalRefunded: 0, balanceDue: 0 }
        }
        state.push(newBill)
        emit()
        return id
    },

    addChargeToIpBill: (admissionId: string, item: BillItem) => {
        state = state.map(b => {
            if (b.admissionId !== admissionId || !isEditable(b.status)) return b
            const items = [...b.items, item]
            return { ...b, items, summary: recalcSummary(items, b.payments) }
        })
        emit()
    },

    addAdvanceToIpBill: (admissionId: string, payment: BillPayment) => {
        state = state.map(b => {
            if (b.admissionId !== admissionId || !isEditable(b.status)) return b
            const payments = [...b.payments, { ...payment, isAdvance: true }]
            return { ...b, payments, summary: recalcSummary(b.items, payments) }
        })
        emit()
    },

    initiateSettlement: (admissionId: string) => {
        state = state.map(b => {
            if (b.admissionId !== admissionId || b.status !== BillWorkflowStatus.Running) return b
            return { ...b, status: BillWorkflowStatus.PendingSettlement }
        })
        emit()
    },

    settleIpBill: (admissionId: string, finalPayment?: BillPayment) => {
        state = state.map(b => {
            if (b.admissionId !== admissionId || b.status !== BillWorkflowStatus.PendingSettlement) return b
            const payments = finalPayment ? [...b.payments, finalPayment] : b.payments
            return {
                ...b,
                status: BillWorkflowStatus.Closed,
                closedAt: new Date().toISOString(),
                payments,
                summary: recalcSummary(b.items, payments)
            }
        })
        emit()
    },

    addRefund: (billId: string, amount: number, mode: PaymentMode, note?: string) => {
        state = state.map(b => {
            if (b.id !== billId) return b
            const refundEntry: BillPayment = {
                id: `REFUND-${Date.now()}`,
                amount: -Math.abs(amount),
                mode,
                status: PaymentStatus.Refunded,
                date: new Date().toISOString(),
                receiptNo: `REF-${Date.now()}`,
                note: note ?? 'Refund issued'
            }
            const payments = [...b.payments, refundEntry]
            return { ...b, payments, summary: recalcSummary(b.items, payments) }
        })
        emit()
    },

    issueCreditNote: (billId: string, reason: string, items: BillItem[], issuedBy?: string) => {
        state = state.map(b => {
            if (b.id !== billId || b.status !== BillWorkflowStatus.Closed) return b
            const creditAmount = items.reduce((sum, item) => {
                const gross = item.quantity * item.unitPrice
                return sum + gross * (1 - item.discountPercent / 100) * (1 + item.taxPercent / 100)
            }, 0)
            const cn: CreditNote = {
                id: `CN-${Date.now()}`,
                originalInvoiceNo: b.invoiceNumber,
                reason,
                items,
                amount: creditAmount,
                issuedAt: new Date().toISOString(),
                issuedBy
            }
            return { ...b, creditNotes: [...(b.creditNotes ?? []), cn] }
        })
        emit()
    }
}

// ─── useBillingStore Hook (Drop-in Replacement) ────────────────────────────────
/**
 * Hook to consume the cross-component billing state.
 * Uses useSyncExternalStore to stay reactive without external libraries.
 */
export function useBillingStore() {
    const bills = useSyncExternalStore(subscribe, () => state, () => state)

    return {
        bills,
        ...billingActions
    }
}
