"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
const BILL_INCLUDE = {
    patient: {
        select: {
            id: true, uhid: true, firstName: true, lastName: true, phone: true
        }
    },
    admission: {
        select: {
            id: true, admissionNumber: true, status: true, department: true
        }
    },
    items: {
        orderBy: { createdAt: "asc" }
    },
    payments: {
        orderBy: { paymentDate: "desc" }
    }
};
let BillingService = class BillingService {
    async generateBillNumber() {
        const year = new Date().getFullYear();
        const updated = await database_1.prisma.$executeRaw `
            UPDATE bill_sequences
            SET last_value = last_value + 1, updated_at = NOW()
            WHERE id = 1 AND year = ${year}
        `;
        if (updated === 0) {
            await database_1.prisma.billSequence.upsert({
                where: { id_year: { id: 1, year } },
                update: { year, lastValue: 1 },
                create: { id: 1, year, lastValue: 1 },
            });
        }
        const seq = await database_1.prisma.billSequence.findUnique({
            where: { id_year: { id: 1, year } },
        });
        return `BILL-${year}-${String(seq.lastValue).padStart(6, "0")}`;
    }
    async create(dto) {
        const patient = await database_1.prisma.patient.findUnique({ where: { id: dto.patientId } });
        if (!patient)
            throw new common_1.NotFoundException(`Patient ${dto.patientId} not found`);
        if (dto.admissionId) {
            const admission = await database_1.prisma.admission.findUnique({ where: { id: dto.admissionId } });
            if (!admission)
                throw new common_1.NotFoundException(`Admission ${dto.admissionId} not found`);
            if (admission.patientId !== dto.patientId) {
                throw new common_1.BadRequestException("Admission does not belong to the specified patient");
            }
        }
        const billNumber = await this.generateBillNumber();
        return database_1.prisma.bill.create({
            data: {
                billNumber,
                patientId: dto.patientId,
                admissionId: dto.admissionId,
                tariffPlanId: dto.tariffPlanId,
                notes: dto.notes,
                status: "DRAFT",
                totalAmount: 0,
                discountAmount: 0,
                taxAmount: 0,
                netAmount: 0,
                paidAmount: 0,
                dueAmount: 0,
            },
            include: BILL_INCLUDE
        });
    }
    async findAll(query) {
        const page = Number(query.page ?? 1);
        const limit = Number(query.limit ?? 10);
        const skip = (page - 1) * limit;
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.patientId)
            where.patientId = query.patientId;
        if (query.admissionId)
            where.admissionId = query.admissionId;
        if (query.search) {
            where.OR = [
                { billNumber: { contains: query.search, mode: "insensitive" } },
                { patient: { firstName: { contains: query.search, mode: "insensitive" } } },
                { patient: { lastName: { contains: query.search, mode: "insensitive" } } },
                { patient: { uhid: { contains: query.search, mode: "insensitive" } } },
            ];
        }
        const [data, total] = await database_1.prisma.$transaction([
            database_1.prisma.bill.findMany({
                where, skip, take: limit,
                orderBy: { createdAt: "desc" },
                include: BILL_INCLUDE,
            }),
            database_1.prisma.bill.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async getStats(query) {
        let startDate;
        let endDate = new Date();
        if (query.period === 'today') {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
        }
        else if (query.period === 'week') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - startDate.getDay());
            startDate.setHours(0, 0, 0, 0);
        }
        else if (query.period === 'month') {
            startDate = new Date();
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        }
        else if (query.period === 'custom' && query.startDate && query.endDate) {
            startDate = new Date(query.startDate);
            endDate = new Date(query.endDate);
            endDate.setHours(23, 59, 59, 999);
        }
        else {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
        }
        const statusFilterQuery = {
            createdAt: {
                gte: startDate,
                lte: endDate,
            }
        };
        const activeDateFilter = {
            ...statusFilterQuery,
            status: { not: 'CANCELLED' }
        };
        const [totalsAgg, statusCountsAgg, opCountsAgg, ipCountsAgg, paymentModeAgg, allBillsCount] = await Promise.all([
            database_1.prisma.bill.aggregate({
                where: activeDateFilter,
                _sum: {
                    paidAmount: true,
                    dueAmount: true,
                    netAmount: true,
                    discountAmount: true,
                }
            }),
            database_1.prisma.bill.groupBy({
                by: ['status'],
                where: statusFilterQuery,
                _count: { id: true }
            }),
            database_1.prisma.bill.aggregate({
                where: { ...activeDateFilter, admissionId: null },
                _count: { id: true },
                _sum: { netAmount: true }
            }),
            database_1.prisma.bill.aggregate({
                where: { ...activeDateFilter, admissionId: { not: null } },
                _count: { id: true },
                _sum: { netAmount: true }
            }),
            database_1.prisma.payment.groupBy({
                by: ['paymentMode'],
                where: { paymentDate: { gte: startDate, lte: endDate } },
                _sum: { amount: true }
            }),
            database_1.prisma.bill.count({ where: statusFilterQuery })
        ]);
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const [pendingSettlements, overdueBills, draftBills] = await Promise.all([
            database_1.prisma.bill.count({ where: { status: { in: ['FINAL', 'PARTIALLY_PAID'] }, admissionId: { not: null } } }),
            database_1.prisma.bill.count({ where: { status: 'FINAL', dueAmount: { gt: 0 }, createdAt: { lt: fortyEightHoursAgo } } }),
            database_1.prisma.bill.count({ where: { status: 'DRAFT' } })
        ]);
        const counts = {
            all: allBillsCount,
            DRAFT: 0,
            FINAL: 0,
            PARTIALLY_PAID: 0,
            PAID: 0,
            CANCELLED: 0,
        };
        statusCountsAgg.forEach((item) => {
            if (counts[item.status] !== undefined) {
                counts[item.status] = item._count.id;
            }
        });
        const paymentModes = {
            CASH: 0,
            CARD: 0,
            UPI: 0,
            ONLINE: 0,
            INSURANCE: 0,
            CHEQUE: 0
        };
        paymentModeAgg.forEach((item) => {
            if (paymentModes[item.paymentMode] !== undefined) {
                paymentModes[item.paymentMode] = parseFloat(item._sum.amount?.toString() || '0');
            }
        });
        return {
            totals: {
                revenue: parseFloat(totalsAgg._sum.paidAmount?.toString() || '0'),
                outstanding: parseFloat(totalsAgg._sum.dueAmount?.toString() || '0'),
                totalBilled: parseFloat(totalsAgg._sum.netAmount?.toString() || '0'),
                discount: parseFloat(totalsAgg._sum.discountAmount?.toString() || '0')
            },
            counts,
            billTypeSplit: {
                op: {
                    count: opCountsAgg._count.id,
                    revenue: parseFloat(opCountsAgg._sum.netAmount?.toString() || '0')
                },
                ip: {
                    count: ipCountsAgg._count.id,
                    revenue: parseFloat(ipCountsAgg._sum.netAmount?.toString() || '0')
                }
            },
            paymentModes,
            alerts: {
                pendingSettlements,
                overdueBills,
                draftBills
            }
        };
    }
    async findOne(id) {
        const bill = await database_1.prisma.bill.findUnique({
            where: { id },
            include: BILL_INCLUDE
        });
        if (!bill)
            throw new common_1.NotFoundException(`Bill ${id} not found`);
        return bill;
    }
    async recalculateBillTotals(tx, billId) {
        const items = await tx.billItem.findMany({ where: { billId } });
        let totalAmount = 0;
        let discountAmount = 0;
        let taxAmount = 0;
        let netAmount = 0;
        for (const item of items) {
            const q = item.quantity;
            const up = parseFloat(item.unitPrice.toString());
            const dp = parseFloat(item.discountPercent.toString());
            const tp = parseFloat(item.taxPercent.toString());
            const itemGross = up * q;
            const itemDiscount = itemGross * (dp / 100);
            const itemPreTax = itemGross - itemDiscount;
            const itemTax = itemPreTax * (tp / 100);
            const itemNet = itemPreTax + itemTax;
            totalAmount += itemGross;
            discountAmount += itemDiscount;
            taxAmount += itemTax;
            netAmount += itemNet;
            await tx.billItem.update({
                where: { id: item.id },
                data: {
                    discountAmount: itemDiscount,
                    taxAmount: itemTax,
                    totalPrice: itemNet
                }
            });
        }
        const payments = await tx.payment.findMany({ where: { billId } });
        const paidAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
        const dueAmount = netAmount - paidAmount;
        return tx.bill.update({
            where: { id: billId },
            data: {
                totalAmount,
                discountAmount,
                taxAmount,
                netAmount,
                paidAmount,
                dueAmount: dueAmount < 0 ? 0 : dueAmount
            },
            include: BILL_INCLUDE
        });
    }
    async addItem(billId, dto) {
        return database_1.prisma.$transaction(async (tx) => {
            const bill = await tx.bill.findUnique({ where: { id: billId } });
            if (!bill)
                throw new common_1.NotFoundException(`Bill ${billId} not found`);
            if (bill.status !== "DRAFT") {
                throw new common_1.BadRequestException("Can only add items to DRAFT bills");
            }
            const service = await tx.service.findUnique({ where: { id: dto.serviceId } });
            if (!service)
                throw new common_1.NotFoundException(`Service ${dto.serviceId} not found`);
            if (service.status !== "ACTIVE") {
                throw new common_1.BadRequestException(`Service ${service.name} is inactive`);
            }
            let unitPrice = parseFloat(service.basePrice.toString());
            let discountPercent = dto.discountPercent ?? 0;
            if (bill.tariffPlanId) {
                const tariffRate = await tx.tariffRate.findUnique({
                    where: { tariffPlanId_serviceId: { tariffPlanId: bill.tariffPlanId, serviceId: service.id } }
                });
                if (tariffRate) {
                    unitPrice = parseFloat(tariffRate.priceOverride.toString());
                    if (dto.discountPercent === undefined && tariffRate.discountPercent) {
                        discountPercent = parseFloat(tariffRate.discountPercent.toString());
                    }
                }
            }
            const taxPercent = parseFloat(service.taxPercent.toString());
            const quantity = dto.quantity ?? 1;
            await tx.billItem.create({
                data: {
                    billId,
                    serviceId: service.id,
                    serviceName: service.name,
                    serviceCode: service.code,
                    quantity,
                    unitPrice,
                    discountPercent,
                    taxPercent,
                    discountAmount: 0,
                    taxAmount: 0,
                    totalPrice: 0
                }
            });
            return this.recalculateBillTotals(tx, billId);
        });
    }
    async removeItem(billId, itemId) {
        return database_1.prisma.$transaction(async (tx) => {
            const bill = await tx.bill.findUnique({ where: { id: billId } });
            if (!bill)
                throw new common_1.NotFoundException(`Bill ${billId} not found`);
            if (bill.status !== "DRAFT") {
                throw new common_1.BadRequestException("Can only remove items from DRAFT bills");
            }
            const item = await tx.billItem.findUnique({ where: { id: itemId } });
            if (!item || item.billId !== billId) {
                throw new common_1.NotFoundException(`BillItem ${itemId} not found in this bill`);
            }
            await tx.billItem.delete({ where: { id: itemId } });
            return this.recalculateBillTotals(tx, billId);
        });
    }
    async finalizeBill(id) {
        return database_1.prisma.$transaction(async (tx) => {
            const bill = await tx.bill.findUnique({
                where: { id },
                include: { _count: { select: { items: true } } }
            });
            if (!bill)
                throw new common_1.NotFoundException(`Bill ${id} not found`);
            if (bill.status !== "DRAFT") {
                throw new common_1.BadRequestException(`Bill is already ${bill.status}`);
            }
            if (bill._count.items === 0) {
                throw new common_1.BadRequestException("Cannot finalize an empty bill");
            }
            return tx.bill.update({
                where: { id },
                data: { status: "FINAL" },
                include: BILL_INCLUDE
            });
        });
    }
    async recordPayment(billId, dto, requestingUserId) {
        return database_1.prisma.$transaction(async (tx) => {
            const bill = await tx.bill.findUnique({ where: { id: billId } });
            if (!bill)
                throw new common_1.NotFoundException(`Bill ${billId} not found`);
            if (!["FINAL", "PARTIALLY_PAID"].includes(bill.status)) {
                throw new common_1.BadRequestException(`Payments can only be added to FINAL or PARTIALLY_PAID bills. Status is ${bill.status}`);
            }
            const dueAmount = parseFloat(bill.dueAmount.toString());
            if (dueAmount <= 0) {
                throw new common_1.BadRequestException("Bill is already fully paid");
            }
            if (dto.amount > dueAmount) {
                throw new common_1.BadRequestException(`Payment amount (${dto.amount}) exceeds due amount (${dueAmount})`);
            }
            await tx.payment.create({
                data: {
                    billId,
                    amount: dto.amount,
                    paymentMode: dto.paymentMode,
                    transactionRef: dto.transactionRef,
                    notes: dto.notes,
                    processedBy: requestingUserId
                }
            });
            const newPaidAmount = parseFloat(bill.paidAmount.toString()) + dto.amount;
            const newDueAmount = parseFloat(bill.netAmount.toString()) - newPaidAmount;
            const isFullyPaid = newDueAmount < 0.01;
            return tx.bill.update({
                where: { id: billId },
                data: {
                    paidAmount: newPaidAmount,
                    dueAmount: isFullyPaid ? 0 : newDueAmount,
                    status: isFullyPaid ? "PAID" : "PARTIALLY_PAID"
                },
                include: BILL_INCLUDE
            });
        });
    }
    async cancelBill(id) {
        return database_1.prisma.$transaction(async (tx) => {
            const bill = await tx.bill.findUnique({
                where: { id },
                include: { _count: { select: { payments: true } } }
            });
            if (!bill)
                throw new common_1.NotFoundException(`Bill ${id} not found`);
            if (bill.status === "CANCELLED") {
                throw new common_1.BadRequestException("Bill is already cancelled");
            }
            if (bill._count.payments > 0) {
                throw new common_1.BadRequestException("Cannot cancel a bill that has payments. Void the payments first/Issue refunds.");
            }
            return tx.bill.update({
                where: { id },
                data: { status: "CANCELLED" },
                include: BILL_INCLUDE
            });
        });
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)()
], BillingService);
//# sourceMappingURL=billing.service.js.map