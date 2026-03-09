import { Injectable } from '@nestjs/common';
import { prisma, Prisma, AdmissionStatus, BedStatus, WardType } from '@carenest/database';

// Type for the result of groupBy in getTopDiagnoses
type DiagnosisGroup = {
    initialDiagnosis: string | null;
    _count: { _all: number };
};

type DepartmentGroup = {
    department: string | null;
    _count: { _all: number };
};


@Injectable()
export class ReportsService {
    private readonly prisma = prisma;
    constructor() { }

    async getKpis(customStart?: string, customEnd?: string) {
        // 1. Total active inpatients
        const totalPatients = await this.prisma.admission.count({
            where: { status: AdmissionStatus.ADMITTED },
        });

        // 2. Bed Occupancy
        const allBeds = await this.prisma.bed.findMany({
            include: { ward: true },
        });

        const totalBedsCount = allBeds.length;
        const occupiedBedsCount = allBeds.filter((b: { status: string }) => b.status === BedStatus.OCCUPIED).length;

        const nicuBeds = allBeds.filter((b: { ward: { type: string } }) => b.ward.type === WardType.NICU);
        const nicuTotal = nicuBeds.length;
        const nicuOccupied = nicuBeds.filter((b: { status: string }) => b.status === BedStatus.OCCUPIED).length;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const start = customStart ? new Date(customStart) : null;
        const end = customEnd ? new Date(customEnd) : null;
        if (end) end.setHours(23, 59, 59, 999);

        const periodStart = start || new Date(today.getFullYear(), today.getMonth(), 1);
        const periodEnd = end || new Date(tomorrow.getTime() - 1);

        // 3. Revenue Today -> strict snapshot of today regardless of filter, or we can make it revenue for the period start?
        // We will keep Revenue Today as literally "Today" to not break the UI grid terminology.
        const revenueTodayAggr = await this.prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                paymentDate: {
                    gte: today,
                    lt: tomorrow,
                },
            },
        });

        const revenueToday = Number(revenueTodayAggr._sum.amount || 0);

        // 4. Monthly Revenue (converted to Period Revenue if dates passed)
        const revenueMonthAggr = await this.prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                paymentDate: {
                    gte: periodStart,
                    lte: periodEnd,
                },
            },
        });
        const revenueThisMonth = Number(revenueMonthAggr._sum.amount || 0);

        // 5. Vaccinations This Period
        const vaccinationsThisMonth = await this.prisma.patientVaccine.count({
            where: {
                administeredDate: { gte: periodStart, lte: periodEnd },
                status: "ADMINISTERED"
            }
        });

        // 6. Lab Tests Ordered This Period
        const labsThisMonth = await this.prisma.labOrder.count({
            where: {
                orderDate: { gte: periodStart, lte: periodEnd }
            }
        });

        return {
            totalPatients,
            bedOccupancy: {
                occupied: occupiedBedsCount,
                total: totalBedsCount,
                percentage: totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0,
            },
            nicuOccupancy: {
                occupied: nicuOccupied,
                total: nicuTotal,
                percentage: nicuTotal > 0 ? Math.round((nicuOccupied / nicuTotal) * 100) : 0,
            },
            revenueToday,
            revenueThisMonth,
            vaccinationsThisMonth,
            labsThisMonth,
        };
    }

    async getAdmissionsTrend(months: number = 6) {
        // Note: SQLite doesn't have TO_CHAR. Postgres does.
        // The safest cross-database approach for a trend chart in Prisma is fetching 
        // the raw records and grouping in memory if the dataset is small enough, OR using raw SQL.
        // Given Prisma's limitations with date grouping, we'll do an in-memory group for the last X months.

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (months - 1));
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);

        const admissions = await this.prisma.admission.findMany({
            where: {
                admissionDate: { gte: startDate },
            },
            select: {
                admissionDate: true,
                dischargeDate: true,
            },
            orderBy: { admissionDate: 'asc' },
        });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const getBucketKey = (date: Date) => `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

        // Initialize month buckets
        const result: Record<string, { month: string; admissions: number; discharges: number; rawDate: Date }> = {};

        for (let i = 0; i < months; i++) {
            const d = new Date(startDate);
            d.setMonth(startDate.getMonth() + i);
            const monthKey = getBucketKey(d);
            result[monthKey] = { month: monthKey, admissions: 0, discharges: 0, rawDate: d };
        }

        admissions.forEach((a: { admissionDate: Date; dischargeDate: Date | null }) => {
            // Add admission
            const admKey = getBucketKey(a.admissionDate);
            if (result[admKey]) {
                result[admKey].admissions++;
            }

            // Add discharge
            if (a.dischargeDate) {
                const disKey = getBucketKey(a.dischargeDate);
                if (result[disKey]) {
                    result[disKey].discharges++;
                }
            }
        });

        const sorted = Object.values(result).sort((a: { rawDate: Date }, b: { rawDate: Date }) => a.rawDate.getTime() - b.rawDate.getTime());
        return sorted.map(({ rawDate, ...rest }: { rawDate: Date, month: string, admissions: number, discharges: number }) => rest);
    }

    async getRevenueTrend(weeks: number = 4) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (weeks * 7));
        startDate.setHours(0, 0, 0, 0);

        const payments = await this.prisma.payment.findMany({
            where: {
                paymentDate: { gte: startDate },
            },
            select: {
                amount: true,
                paymentDate: true,
            },
            orderBy: { paymentDate: 'asc' },
        });

        // Group by iso week simply by bucket array
        // Since we just need 4 distinct buckets, we can sort them temporally.

        // Create week buckets
        const result: { week: string, revenue: number }[] = [];
        for (let i = weeks; i >= 1; i--) {
            result.push({ week: `Week ${i} Ago`, revenue: 0 });
        }
        result[weeks - 1].week = "This Week";

        const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
        const now = new Date().getTime();

        payments.forEach((p: { amount: Prisma.Decimal | number; paymentDate: Date }) => {
            const pTime = p.paymentDate.getTime();
            const weeksAgo = Math.floor((now - pTime) / millisecondsPerWeek);

            const bucketIndex = (weeks - 1) - weeksAgo;
            // Safety check if bucket is within range
            if (bucketIndex >= 0 && bucketIndex < weeks) {
                result[bucketIndex].revenue += Number(p.amount);
            }
        });

        return result;
    }

    async getDepartmentCensus(customStart?: string, customEnd?: string) {
        const start = customStart ? new Date(customStart) : null;
        const end = customEnd ? new Date(customEnd) : null;
        if (end) end.setHours(23, 59, 59, 999);

        const whereClause: any = { status: AdmissionStatus.ADMITTED };
        // If dates are provided, we check admissions that happened in that period
        // Otherwise, it's just a snapshot of current active admissions
        if (start && end) {
            whereClause.admissionDate = { gte: start, lte: end };
        }

        const admissions = await this.prisma.admission.groupBy({
            by: ['department'],
            where: whereClause,
            _count: {
                _all: true,
            },
        });

        const colors = ["#3b82f6", "#ef4444", "#8b5cf6", "#f59e0b", "#10b981", "#6366f1"];

        return admissions.map((a: DepartmentGroup, index: number) => ({
            name: a.department || 'Unknown',
            value: a._count._all,
            color: colors[index % colors.length],
        })).sort((a: { value: number }, b: { value: number }) => b.value - a.value);
    }

    async getTopDiagnoses(limit: number = 6, customStart?: string, customEnd?: string) {
        const start = customStart ? new Date(customStart) : null;
        const end = customEnd ? new Date(customEnd) : null;
        if (end) end.setHours(23, 59, 59, 999);

        const whereClause: any = { initialDiagnosis: { not: null } };
        if (start && end) {
            whereClause.admissionDate = { gte: start, lte: end };
        } else if (start) {
            whereClause.admissionDate = { gte: start };
        } else if (end) {
            whereClause.admissionDate = { lte: end };
        }

        const diagnoses = await this.prisma.admission.groupBy({
            by: ['initialDiagnosis'],
            where: whereClause,
            _count: {
                _all: true,
            },
            orderBy: { _count: { _all: 'desc' } },
            take: limit,
        });

        return diagnoses.map((d: DiagnosisGroup) => ({
            diagnosis: d.initialDiagnosis,
            count: d._count._all,
            trend: "stable", // Mock trend as calculating historical week-over-week is complex for now
        }));
    }

    async getVaccinationTrend(days: number = 7) {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0); // Start of 'days' ago

        // Fetch administered vaccines in the date range
        const vaccines = await this.prisma.patientVaccine.findMany({
            where: {
                status: 'ADMINISTERED',
                administeredDate: {
                    gte: startDate,
                    lte: today,
                },
            },
            select: {
                administeredDate: true,
            },
        });

        // Initialize buckets for each day
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const result: Record<string, { day: string; count: number; rawDate: Date }> = {};

        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateStr = d.toISOString().split('T')[0]; // Use YYYY-MM-DD as key for safety
            result[dateStr] = {
                day: dayNames[d.getDay()], // Short day name for UI
                count: 0,
                rawDate: d
            };
        }

        // Count vaccines into buckets
        vaccines.forEach((v: { administeredDate: Date | null }) => {
            if (v.administeredDate) {
                const dateStr = v.administeredDate.toISOString().split('T')[0];
                if (result[dateStr]) {
                    result[dateStr].count++;
                }
            }
        });

        // Convert dict to sorted array
        const sorted = Object.values(result).sort((a: { rawDate: Date }, b: { rawDate: Date }) => a.rawDate.getTime() - b.rawDate.getTime());

        // Pick only what UI needs
        return sorted.map(({ day, count }) => ({ day, count }));
    }

    async generateExportCsv(customStart?: string, customEnd?: string): Promise<string> {
        const start = customStart ? new Date(customStart) : null;
        const end = customEnd ? new Date(customEnd) : null;
        if (end) end.setHours(23, 59, 59, 999);

        let csv = '';

        // Helper to format dates
        const formatDate = (date: Date) => date.toISOString().split('T')[0];
        // Helper to escape CSV strings
        const escapeCsv = (str: string | null | undefined) => {
            if (!str) return '""';
            const s = String(str).replace(/"/g, '""');
            return `"${s}"`;
        };

        // --- 1. SUMMARY SECTION ---
        csv += '=== SUMMARY ===\n';
        csv += 'Metric,Value\n';

        const kpis = await this.getKpis(customStart, customEnd);
        csv += `Report Period,${customStart || 'All Time'} to ${customEnd || 'Present'}\n`;
        csv += `Total Admissions in Period,${kpis.totalPatients}\n`;
        csv += `Bed Occupancy,${kpis.bedOccupancy.percentage}%\n`;
        csv += `NICU Occupancy,${kpis.nicuOccupancy.percentage}%\n`;
        csv += `Revenue in Period,${kpis.revenueThisMonth}\n`;
        csv += `Vaccinations in Period,${kpis.vaccinationsThisMonth}\n`;
        csv += `Lab Tests in Period,${kpis.labsThisMonth}\n`;

        csv += '\n\n';

        // --- 2. ADMISSIONS DETAIL SECTION ---
        csv += '=== ADMISSIONS DETAIL ===\n';
        csv += 'Patient Name,UHID,Admission Date,Department,Diagnosis,Status\n';

        const whereClause: Prisma.AdmissionWhereInput = {};
        if (start && end) {
            whereClause.admissionDate = { gte: start, lte: end };
        } else if (start) {
            whereClause.admissionDate = { gte: start };
        } else if (end) {
            whereClause.admissionDate = { lte: end };
        }

        const admissions = await this.prisma.admission.findMany({
            where: whereClause,
            include: { patient: true },
            orderBy: { admissionDate: 'desc' }
        });

        if (admissions.length === 0) {
            csv += 'No admissions recorded in this period\n';
        } else {
            for (const adm of admissions) {
                const name = `${adm.patient.firstName} ${adm.patient.lastName}`;
                csv += `${escapeCsv(name)},${escapeCsv(adm.patient.uhid)},${formatDate(adm.admissionDate)},${escapeCsv(adm.department)},${escapeCsv(adm.initialDiagnosis)},${adm.status}\n`;
            }
        }

        csv += '\n\n';

        // --- 3. REVENUE BREAKDOWN SECTION ---
        csv += '=== REVENUE BREAKDOWN ===\n';
        csv += 'Payment Date,Amount,Payment Mode,Transaction Ref\n';

        const paymentWhere: Prisma.PaymentWhereInput = {};
        if (start && end) {
            paymentWhere.paymentDate = { gte: start, lte: end };
        } else if (start) {
            paymentWhere.paymentDate = { gte: start };
        } else if (end) {
            paymentWhere.paymentDate = { lte: end };
        }

        const payments = await this.prisma.payment.findMany({
            where: paymentWhere,
            orderBy: { paymentDate: 'desc' }
        });

        if (payments.length === 0) {
            csv += 'No payments recorded in this period\n';
        } else {
            for (const p of payments) {
                csv += `${formatDate(p.paymentDate)},${p.amount},${p.paymentMode},${escapeCsv(p.transactionRef)}\n`;
            }
        }

        return csv;
    }
}
