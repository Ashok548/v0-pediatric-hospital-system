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
    async getKpis(customStart, customEnd) {
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
        const start = customStart ? new Date(customStart) : null;
        const end = customEnd ? new Date(customEnd) : null;
        if (end)
            end.setHours(23, 59, 59, 999);
        const periodStart = start || new Date(today.getFullYear(), today.getMonth(), 1);
        const periodEnd = end || new Date(tomorrow.getTime() - 1);
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
        const vaccinationsThisMonth = await this.prisma.patientVaccine.count({
            where: {
                administeredDate: { gte: periodStart, lte: periodEnd },
                status: "ADMINISTERED"
            }
        });
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
            result.push({ week: `Week ${i} Ago`, revenue: 0 });
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
    async getDepartmentCensus(customStart, customEnd) {
        const start = customStart ? new Date(customStart) : null;
        const end = customEnd ? new Date(customEnd) : null;
        if (end)
            end.setHours(23, 59, 59, 999);
        const whereClause = { status: database_1.AdmissionStatus.ADMITTED };
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
        return admissions.map((a, index) => ({
            name: a.department || 'Unknown',
            value: a._count._all,
            color: colors[index % colors.length],
        })).sort((a, b) => b.value - a.value);
    }
    async getTopDiagnoses(limit = 6, customStart, customEnd) {
        const start = customStart ? new Date(customStart) : null;
        const end = customEnd ? new Date(customEnd) : null;
        if (end)
            end.setHours(23, 59, 59, 999);
        const whereClause = { initialDiagnosis: { not: null } };
        if (start && end) {
            whereClause.admissionDate = { gte: start, lte: end };
        }
        else if (start) {
            whereClause.admissionDate = { gte: start };
        }
        else if (end) {
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
        return diagnoses.map((d) => ({
            diagnosis: d.initialDiagnosis,
            count: d._count._all,
            trend: "stable",
        }));
    }
    async getVaccinationTrend(days = 7) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);
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
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const result = {};
        for (let i = 0; i < days; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            result[dateStr] = {
                day: dayNames[d.getDay()],
                count: 0,
                rawDate: d
            };
        }
        vaccines.forEach((v) => {
            if (v.administeredDate) {
                const dateStr = v.administeredDate.toISOString().split('T')[0];
                if (result[dateStr]) {
                    result[dateStr].count++;
                }
            }
        });
        const sorted = Object.values(result).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
        return sorted.map(({ day, count }) => ({ day, count }));
    }
    async generateExportCsv(customStart, customEnd) {
        const start = customStart ? new Date(customStart) : null;
        const end = customEnd ? new Date(customEnd) : null;
        if (end)
            end.setHours(23, 59, 59, 999);
        let csv = '';
        const formatDate = (date) => date.toISOString().split('T')[0];
        const escapeCsv = (str) => {
            if (!str)
                return '""';
            const s = String(str).replace(/"/g, '""');
            return `"${s}"`;
        };
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
        csv += '=== ADMISSIONS DETAIL ===\n';
        csv += 'Patient Name,UHID,Admission Date,Department,Diagnosis,Status\n';
        const whereClause = {};
        if (start && end) {
            whereClause.admissionDate = { gte: start, lte: end };
        }
        else if (start) {
            whereClause.admissionDate = { gte: start };
        }
        else if (end) {
            whereClause.admissionDate = { lte: end };
        }
        const admissions = await this.prisma.admission.findMany({
            where: whereClause,
            include: { patient: true },
            orderBy: { admissionDate: 'desc' }
        });
        if (admissions.length === 0) {
            csv += 'No admissions recorded in this period\n';
        }
        else {
            for (const adm of admissions) {
                const name = `${adm.patient.firstName} ${adm.patient.lastName}`;
                csv += `${escapeCsv(name)},${escapeCsv(adm.patient.uhid)},${formatDate(adm.admissionDate)},${escapeCsv(adm.department)},${escapeCsv(adm.initialDiagnosis)},${adm.status}\n`;
            }
        }
        csv += '\n\n';
        csv += '=== REVENUE BREAKDOWN ===\n';
        csv += 'Payment Date,Amount,Payment Mode,Transaction Ref\n';
        const paymentWhere = {};
        if (start && end) {
            paymentWhere.paymentDate = { gte: start, lte: end };
        }
        else if (start) {
            paymentWhere.paymentDate = { gte: start };
        }
        else if (end) {
            paymentWhere.paymentDate = { lte: end };
        }
        const payments = await this.prisma.payment.findMany({
            where: paymentWhere,
            orderBy: { paymentDate: 'desc' }
        });
        if (payments.length === 0) {
            csv += 'No payments recorded in this period\n';
        }
        else {
            for (const p of payments) {
                csv += `${formatDate(p.paymentDate)},${p.amount},${p.paymentMode},${escapeCsv(p.transactionRef)}\n`;
            }
        }
        return csv;
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ReportsService);
//# sourceMappingURL=reports.service.js.map