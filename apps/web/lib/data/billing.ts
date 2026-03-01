// ─────────────────────────────────────────────────────────────────────────────
// lib/data/billing.ts
// Mock billing / invoice data + async data functions.
//
// TO MIGRATE TO API: replace each async function body with a fetch() call.
// ─────────────────────────────────────────────────────────────────────────────

import type { Bill, BillStatus } from "./types"

// ─── Mock Data ───────────────────────────────────────────────────────────────
export const bills: Bill[] = [
    { id: "B-001", invoiceNo: "INV-2026-0342", patientName: "Rohan Mehta", uhid: "CN-2026-0002", gender: "M", department: "General Paediatrics", services: ["Consultation", "Blood Test"], totalAmount: 2800, paidAmount: 2800, status: "Paid", paymentMode: "UPI", date: "22 Feb 2026", doctor: "Dr. Anil Kumar" },
    { id: "B-002", invoiceNo: "INV-2026-0341", patientName: "Arya Sharma", uhid: "CN-2026-0001", gender: "F", department: "General Paediatrics", services: ["IP Charges", "Medicines", "Nursing"], totalAmount: 18500, paidAmount: 18500, status: "Paid", paymentMode: "Insurance", date: "22 Feb 2026", doctor: "Dr. Priya Reddy" },
    { id: "B-003", invoiceNo: "INV-2026-0340", patientName: "Saanvi Nair", uhid: "CN-2026-0005", gender: "F", department: "General Paediatrics", services: ["IP Charges", "Surgery", "ICU"], totalAmount: 45000, paidAmount: 20000, status: "Partial", paymentMode: "Card", date: "21 Feb 2026", doctor: "Dr. Anil Kumar" },
    { id: "B-004", invoiceNo: "INV-2026-0339", patientName: "Kabir Rao", uhid: "CN-2026-0010", gender: "M", department: "Neonatology", services: ["Consultation", "Vaccination"], totalAmount: 3200, paidAmount: 0, status: "Pending", date: "22 Feb 2026", doctor: "Dr. Priya Reddy" },
    { id: "B-005", invoiceNo: "INV-2026-0338", patientName: "Reyansh Tiwari", uhid: "CN-2026-0012", gender: "M", department: "PICU", services: ["PICU Charges", "Ventilator", "Medicines"], totalAmount: 72000, paidAmount: 30000, status: "Partial", paymentMode: "Insurance", date: "20 Feb 2026", doctor: "Dr. Anil Kumar" },
    { id: "B-006", invoiceNo: "INV-2026-0337", patientName: "Anika Patel", uhid: "CN-2026-0003", gender: "F", department: "NICU", services: ["NICU Daily", "Incubator", "Oxygen"], totalAmount: 95000, paidAmount: 95000, status: "Paid", paymentMode: "Insurance", date: "19 Feb 2026", doctor: "Dr. Meera Iyer" },
    { id: "B-007", invoiceNo: "INV-2026-0336", patientName: "Myra Joshi", uhid: "CN-2026-0009", gender: "F", department: "General Paediatrics", services: ["Discharge", "Medicines"], totalAmount: 12400, paidAmount: 0, status: "Overdue", date: "18 Feb 2026", doctor: "Dr. Meera Iyer" },
    { id: "B-008", invoiceNo: "INV-2026-0335", patientName: "Aarav Singh", uhid: "CN-2026-0008", gender: "M", department: "General Paediatrics", services: ["IP Charges", "X-Ray", "Medicines"], totalAmount: 22000, paidAmount: 22000, status: "Paid", paymentMode: "Card", date: "21 Feb 2026", doctor: "Dr. Anil Kumar" },
    { id: "B-009", invoiceNo: "INV-2026-0334", patientName: "Ishaan Desai", uhid: "CN-2026-0006", gender: "M", department: "Paediatric Cardiology", services: ["Echo", "Consultation"], totalAmount: 5500, paidAmount: 5500, status: "Paid", paymentMode: "Cash", date: "22 Feb 2026", doctor: "Dr. Meera Iyer" },
    { id: "B-010", invoiceNo: "INV-2026-0333", patientName: "Diya Gupta", uhid: "CN-2026-0007", gender: "F", department: "NICU", services: ["NICU Daily", "Oxygen", "Phototherapy"], totalAmount: 58000, paidAmount: 0, status: "Pending", date: "22 Feb 2026", doctor: "Dr. Priya Reddy" },
    { id: "B-011", invoiceNo: "INV-2026-0332", patientName: "Prisha Kulkarni", uhid: "CN-2026-0015", gender: "F", department: "General Paediatrics", services: ["Discharge Summary", "Medicines"], totalAmount: 8200, paidAmount: 8200, status: "Paid", paymentMode: "UPI", date: "21 Feb 2026", doctor: "Dr. Anil Kumar" },
    { id: "B-012", invoiceNo: "INV-2026-0331", patientName: "Kiara Bhat", uhid: "CN-2026-0013", gender: "F", department: "General Paediatrics", services: ["Consultation", "Lab"], totalAmount: 1800, paidAmount: 0, status: "Pending", date: "22 Feb 2026", doctor: "Dr. Priya Reddy" },
]

// ─── Async Data Functions ─────────────────────────────────────────────────────

export async function getBills(): Promise<Bill[]> {
    return bills
}

export async function getBillsByStatus(status: BillStatus): Promise<Bill[]> {
    return bills.filter(b => b.status === status)
}

export async function getBillingTotals() {
    return {
        revenue: bills.reduce((s, b) => s + b.paidAmount, 0),
        pending: bills.reduce((s, b) => s + (b.totalAmount - b.paidAmount), 0),
        paid: bills.filter(b => b.status === "Paid").length,
        overdue: bills.filter(b => b.status === "Overdue").length,
        total: bills.length,
    }
}

export async function getBillingCounts() {
    return {
        all: bills.length,
        Paid: bills.filter(b => b.status === "Paid").length,
        Pending: bills.filter(b => b.status === "Pending").length,
        Partial: bills.filter(b => b.status === "Partial").length,
        Overdue: bills.filter(b => b.status === "Overdue").length,
    }
}
