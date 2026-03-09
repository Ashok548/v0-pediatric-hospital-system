import type { Response } from 'express';
import { ReportsService } from './reports.service';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    getKpis(startDate?: string, endDate?: string): Promise<{
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
        vaccinationsThisMonth: any;
        labsThisMonth: any;
    }>;
    getAdmissionsTrend(months?: string): Promise<{
        month: string;
        admissions: number;
        discharges: number;
    }[]>;
    getRevenueTrend(weeks?: string): Promise<{
        week: string;
        revenue: number;
    }[]>;
    getDepartmentCensus(startDate?: string, endDate?: string): Promise<any>;
    getTopDiagnoses(limit?: string, startDate?: string, endDate?: string): Promise<any>;
    getVaccinationTrend(days?: string): Promise<{
        day: string;
        count: number;
    }[]>;
    exportCsv(res: Response, startDate?: string, endDate?: string): Promise<void>;
}
