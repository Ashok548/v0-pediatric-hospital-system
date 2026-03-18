// ─── Billing API Types (Aligned with Backend Schema) ─────────────────────────

export type BillStatus = 'DRAFT' | 'FINAL' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';

export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'INSURANCE' | 'CHEQUE';

export interface ApiBillItem {
    id: string;
    billId: string;
    serviceId: string;
    serviceName: string;
    serviceCode: string;
    quantity: number;
    unitPrice: number;       // Decimal
    discountPercent: number; // Decimal
    discountAmount: number;  // Decimal
    taxPercent: number;      // Decimal
    taxAmount: number;       // Decimal
    totalPrice: number;      // Decimal
    createdAt: string;
}

export interface ApiPayment {
    id: string;
    billId: string;
    amount: number;          // Decimal
    paymentMode: PaymentMode;
    transactionRef?: string | null;
    notes?: string | null;
    paymentDate: string;
    processedBy?: string | null;
}

export interface ApiBill {
    id: string;
    billNumber: string;

    patientId: string;
    patient?: {
        id: string;
        uhid: string;
        firstName: string;
        lastName: string;
        phone?: string | null;
    };

    admissionId?: string | null;
    admission?: {
        id: string;
        admissionNumber: string;
        status: string;
        department: string;
    } | null;

    appointmentId?: string | null;
    opVisitId?: string | null;
    opNumber?: string | null; // Populated via opVisit relation
    opVisit?: {
        id: string;
        opNumber: string;
        visitDate: string;
        department: string;
        doctor?: {
            id: string;
            name: string;
            consultationFee: number;
        } | null;
    } | null;

    tariffPlanId?: string | null;

    totalAmount: number;     // Decimal
    discountAmount: number;  // Decimal
    taxAmount: number;       // Decimal
    netAmount: number;       // Decimal
    paidAmount: number;      // Decimal
    dueAmount: number;       // Decimal

    status: BillStatus;
    notes?: string | null;

    createdAt: string;
    updatedAt: string;

    items?: ApiBillItem[];
    payments?: ApiPayment[];
}

export interface CreateBillDto {
    patientId: string;
    admissionId?: string;
    appointmentId?: string;
    opVisitId?: string;
    tariffPlanId?: string;
    doctorId?: string;
    department?: string;
    visitDate?: string;
    notes?: string;
}

export interface AddBillItemDto {
    serviceId: string;
    quantity?: number;
    discountPercent?: number;
    unitPrice?: number;
}

export interface RecordPaymentDto {
    amount: number;
    paymentMode: PaymentMode;
    transactionRef?: string;
    notes?: string;
}

// ─── Mapping Helpers for Component Compatibility ───────────────────────────────

/**
 * The components used nice string UI colors for old BillWorkflowStatus. 
 * We map the new native BillStatus to these.
 */
export const MappedBillStatusColors: Record<BillStatus, { label: string; className: string }> = {
    'DRAFT': { label: 'Draft', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    'FINAL': { label: 'Final', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    'PARTIALLY_PAID': { label: 'Partially Paid', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    'PAID': { label: 'Paid', className: 'bg-green-50 text-green-700 border-green-200' },
    'CANCELLED': { label: 'Cancelled', className: 'bg-red-50 text-red-700 border-red-200' }
};

export const MappedPaymentModeLabels: Record<PaymentMode, string> = {
    'CASH': 'Cash',
    'CARD': 'Credit/Debit Card',
    'UPI': 'UPI',
    'ONLINE': 'Online Transfer',
    'INSURANCE': 'Insurance',
    'CHEQUE': 'Cheque'
};

export interface BillingStats {
    totals: {
        revenue: number;
        outstanding: number;
        totalBilled: number;
        discount: number;
    };
    counts: Record<BillStatus | 'all', number>;
    billTypeSplit: {
        op: { count: number; revenue: number };
        ip: { count: number; revenue: number };
    };
    paymentModes: Record<PaymentMode, number>;
    alerts: {
        pendingSettlements: number;
        overdueBills: number;
        draftBills: number;
    };
}
