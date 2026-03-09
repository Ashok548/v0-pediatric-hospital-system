export declare class ReportsService {
    private readonly prisma;
    constructor();
    getKpis(customStart?: string, customEnd?: string): Promise<{
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
    getAdmissionsTrend(months?: number): Promise<{
        month: string;
        admissions: number;
        discharges: number;
    }[]>;
    getRevenueTrend(weeks?: number): Promise<{
        week: string;
        revenue: number;
    }[]>;
    getDepartmentCensus(customStart?: string, customEnd?: string): Promise<any>;
    getTopDiagnoses(limit?: number, customStart?: string, customEnd?: string): Promise<any>;
    getVaccinationTrend(days?: number): Promise<{
        day: string;
        count: number;
    }[]>;
    generateExportCsv(customStart?: string, customEnd?: string): Promise<string>;
}
