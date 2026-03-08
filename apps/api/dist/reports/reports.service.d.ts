export declare class ReportsService {
    private readonly prisma;
    constructor();
    getKpis(): Promise<{
        totalPatients: any;
        bedOccupancy: {
            occupied: any;
            total: any;
            percentage: number;
        };
        nicuOccupancy: {
            occupied: any;
            total: any;
            percentage: number;
        };
        revenueToday: number;
        revenueThisMonth: number;
    }>;
    getAdmissionsTrend(months?: number): Promise<{
        month: string;
        admissions: number;
        discharges: number;
    }[]>;
    getRevenueTrend(weeks?: number): Promise<{
        week: string;
        revenue: number;
        target: number;
    }[]>;
    getDepartmentCensus(): Promise<any>;
    getTopDiagnoses(limit?: number): Promise<any>;
}
