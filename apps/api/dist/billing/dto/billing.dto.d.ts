import { BillStatus, PaymentMode } from "@carenest/database";
export declare class CreateBillDto {
    patientId: string;
    admissionId?: string;
    tariffPlanId?: string;
    notes?: string;
}
export declare class AddBillItemDto {
    serviceId: string;
    quantity?: number;
    discountPercent?: number;
}
export declare class RecordPaymentDto {
    amount: number;
    paymentMode: PaymentMode;
    transactionRef?: string;
    notes?: string;
}
export declare class QueryBillsDto {
    status?: BillStatus;
    search?: string;
    patientId?: string;
    admissionId?: string;
    page?: number;
    limit?: number;
}
export declare class BillingStatsQueryDto {
    period?: 'today' | 'week' | 'month' | 'custom';
    startDate?: string;
    endDate?: string;
}
