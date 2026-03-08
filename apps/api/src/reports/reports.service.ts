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

    async getKpis() {
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

        // 3. Revenue Today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

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

        // 4. Monthly Revenue (for the KPI card)
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const revenueMonthAggr = await this.prisma.payment.aggregate({
            _sum: { amount: true },
            where: {
                paymentDate: {
                    gte: firstDayOfMonth,
                },
            },
        });
        const revenueThisMonth = Number(revenueMonthAggr._sum.amount || 0);

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
        const result: { week: string, revenue: number, target: number }[] = [];
        for (let i = weeks; i >= 1; i--) {
            result.push({ week: `Week ${i} Ago`, revenue: 0, target: 400000 });
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

    async getDepartmentCensus() {
        const admissions = await this.prisma.admission.groupBy({
            by: ['department'],
            where: {
                status: AdmissionStatus.ADMITTED,
            },
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

    async getTopDiagnoses(limit: number = 6) {
        const diagnoses = await this.prisma.admission.groupBy({
            by: ['initialDiagnosis'],
            where: {
                initialDiagnosis: {
                    not: null,
                },
            },
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
}
