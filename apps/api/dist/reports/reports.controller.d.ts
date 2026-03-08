import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
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
    getAdmissionsTrend(months?: string): Promise<{
        month: string;
        admissions: number;
        discharges: number;
    }[]>;
    getRevenueTrend(weeks?: string): Promise<{
        week: string;
        revenue: number;
        target: number;
    }[]>;
    getDepartmentCensus(): Promise<any>;
    getTopDiagnoses(limit?: string): Promise<any>;
}
