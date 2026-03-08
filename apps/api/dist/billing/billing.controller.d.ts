import type { Request } from "express";
import { BillingService } from "./billing.service";
import { CreateBillDto, AddBillItemDto, RecordPaymentDto, QueryBillsDto, BillingStatsQueryDto } from "./dto/billing.dto";
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    create(dto: CreateBillDto): Promise<any>;
    findAll(query: QueryBillsDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(query: BillingStatsQueryDto): Promise<{
        totals: {
            revenue: number;
            outstanding: number;
            totalBilled: number;
            discount: number;
        };
        counts: {
            all: any;
            DRAFT: number;
            FINAL: number;
            PARTIALLY_PAID: number;
            PAID: number;
            CANCELLED: number;
        };
        billTypeSplit: {
            op: {
                count: any;
                revenue: number;
            };
            ip: {
                count: any;
                revenue: number;
            };
        };
        paymentModes: {
            CASH: number;
            CARD: number;
            UPI: number;
            ONLINE: number;
            INSURANCE: number;
            CHEQUE: number;
        };
        alerts: {
            pendingSettlements: any;
            overdueBills: any;
            draftBills: any;
        };
    }>;
    findOne(id: string): Promise<any>;
    addItem(id: string, dto: AddBillItemDto): Promise<any>;
    removeItem(id: string, itemId: string): Promise<any>;
    finalizeBill(id: string): Promise<any>;
    recordPayment(id: string, dto: RecordPaymentDto, req: Request): Promise<any>;
    cancelBill(id: string): Promise<any>;
}
