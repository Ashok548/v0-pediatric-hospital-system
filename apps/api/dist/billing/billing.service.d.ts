import { CreateBillDto, AddBillItemDto, RecordPaymentDto, QueryBillsDto, BillingStatsQueryDto } from "./dto/billing.dto";
export declare class BillingService {
    private generateBillNumber;
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
    private recalculateBillTotals;
    addItem(billId: string, dto: AddBillItemDto): Promise<any>;
    removeItem(billId: string, itemId: string): Promise<any>;
    finalizeBill(id: string): Promise<any>;
    recordPayment(billId: string, dto: RecordPaymentDto, requestingUserId?: string): Promise<any>;
    cancelBill(id: string): Promise<any>;
}
