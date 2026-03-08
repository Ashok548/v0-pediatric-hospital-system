"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let ReportsService = class ReportsService {
    prisma = database_1.prisma;
    constructor() { }
    async getKpis() {
        const totalPatients = await this.prisma.admission.count({
            where: { status: database_1.AdmissionStatus.ADMITTED },
        });
        const allBeds = await this.prisma.bed.findMany({
            include: { ward: true },
        });
        const totalBedsCount = allBeds.length;
        const occupiedBedsCount = allBeds.filter((b) => b.status === database_1.BedStatus.OCCUPIED).length;
        const nicuBeds = allBeds.filter((b) => b.ward.type === database_1.WardType.NICU);
        const nicuTotal = nicuBeds.length;
        const nicuOccupied = nicuBeds.filter((b) => b.status === database_1.BedStatus.OCCUPIED).length;
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
    async getAdmissionsTrend(months = 6) {
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
        const getBucketKey = (date) => `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        const result = {};
        for (let i = 0; i < months; i++) {
            const d = new Date(startDate);
            d.setMonth(startDate.getMonth() + i);
            const monthKey = getBucketKey(d);
            result[monthKey] = { month: monthKey, admissions: 0, discharges: 0, rawDate: d };
        }
        admissions.forEach((a) => {
            const admKey = getBucketKey(a.admissionDate);
            if (result[admKey]) {
                result[admKey].admissions++;
            }
            if (a.dischargeDate) {
                const disKey = getBucketKey(a.dischargeDate);
                if (result[disKey]) {
                    result[disKey].discharges++;
                }
            }
        });
        const sorted = Object.values(result).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
        return sorted.map(({ rawDate, ...rest }) => rest);
    }
    async getRevenueTrend(weeks = 4) {
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
        const result = [];
        for (let i = weeks; i >= 1; i--) {
            result.push({ week: `Week ${i} Ago`, revenue: 0, target: 400000 });
        }
        result[weeks - 1].week = "This Week";
        const millisecondsPerWeek = 7 * 24 * 60 * 60 * 1000;
        const now = new Date().getTime();
        payments.forEach((p) => {
            const pTime = p.paymentDate.getTime();
            const weeksAgo = Math.floor((now - pTime) / millisecondsPerWeek);
            const bucketIndex = (weeks - 1) - weeksAgo;
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
                status: database_1.AdmissionStatus.ADMITTED,
            },
            _count: {
                _all: true,
            },
        });
        const colors = ["#3b82f6", "#ef4444", "#8b5cf6", "#f59e0b", "#10b981", "#6366f1"];
        return admissions.map((a, index) => ({
            name: a.department || 'Unknown',
            value: a._count._all,
            color: colors[index % colors.length],
        })).sort((a, b) => b.value - a.value);
    }
    async getTopDiagnoses(limit = 6) {
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
        return diagnoses.map((d) => ({
            diagnosis: d.initialDiagnosis,
            count: d._count._all,
            trend: "stable",
        }));
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ReportsService);
//# sourceMappingURL=reports.service.js.map