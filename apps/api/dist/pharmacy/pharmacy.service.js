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
exports.PharmacyService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@carenest/database");
let PharmacyService = class PharmacyService {
    prisma = database_1.prisma;
    constructor() { }
    async getInventory() {
        return this.prisma.medication.findMany({
            orderBy: { drugName: 'asc' },
        });
    }
    async getPrescriptions(query) {
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.admissionId)
            where.admissionId = query.admissionId;
        if (query.search) {
            where.OR = [
                { patient: { firstName: { contains: query.search, mode: 'insensitive' } } },
                { patient: { lastName: { contains: query.search, mode: 'insensitive' } } },
                { prescriptionNumber: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        return this.prisma.prescription.findMany({
            where,
            include: {
                patient: true,
                admission: {
                    include: {
                        currentBed: { include: { ward: true } }
                    }
                },
                doctor: true,
                items: { include: { medication: true } },
            },
            orderBy: { orderedAt: 'desc' }
        });
    }
    async getPrescription(id) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { id },
            include: {
                patient: true,
                admission: { include: { currentBed: { include: { ward: true } } } },
                doctor: true,
                items: { include: { medication: true } },
            }
        });
        if (!prescription)
            throw new common_1.NotFoundException('Prescription not found');
        return prescription;
    }
    async createPrescription(dto) {
        return this.prisma.$transaction(async (tx) => {
            const currentYear = new Date().getFullYear();
            const seq = await tx.prescriptionSequence.upsert({
                where: { id_year: { id: 1, year: currentYear } },
                update: { lastValue: { increment: 1 } },
                create: { id: 1, year: currentYear, lastValue: 1 },
            });
            const rxNumber = `RX-${currentYear}-${seq.lastValue.toString().padStart(6, '0')}`;
            return tx.prescription.create({
                data: {
                    prescriptionNumber: rxNumber,
                    patientId: dto.patientId,
                    admissionId: dto.admissionId,
                    doctorId: dto.doctorId,
                    notes: dto.notes,
                    status: 'PENDING',
                    items: {
                        create: dto.items.map(item => ({
                            medicationId: item.medicationId,
                            prescribedQty: item.prescribedQty,
                        }))
                    }
                },
                include: { items: true }
            });
        });
    }
    async dispensePrescription(id, dto, dispensedBy) {
        return this.prisma.$transaction(async (tx) => {
            const rx = await tx.prescription.findUnique({
                where: { id },
                include: { items: { include: { medication: true } } }
            });
            if (!rx)
                throw new common_1.NotFoundException('Prescription not found');
            if (rx.status === 'DISPENSED' || rx.status === 'RETURNED' || rx.status === 'CANCELLED') {
                throw new common_1.BadRequestException(`Cannot dispense prescription in ${rx.status} status`);
            }
            let allFullyDispensed = true;
            let totalAmountToBill = 0;
            const billedItemsToCreate = [];
            for (const rxItem of rx.items) {
                const dispenseInput = dto.items.find(i => i.prescriptionItemId === rxItem.id);
                if (!dispenseInput) {
                    allFullyDispensed = false;
                    continue;
                }
                const qtyToDispenseThisTime = dispenseInput.dispensedQty;
                if (qtyToDispenseThisTime <= 0)
                    continue;
                if (rxItem.medication.stockAvailable < qtyToDispenseThisTime) {
                    throw new common_1.BadRequestException(`Insufficient stock for ${rxItem.medication.drugName}. Available: ${rxItem.medication.stockAvailable}, Requested: ${qtyToDispenseThisTime}`);
                }
                const newTotalDispensed = rxItem.dispensedQty + qtyToDispenseThisTime;
                if (newTotalDispensed < rxItem.prescribedQty) {
                    allFullyDispensed = false;
                }
                await tx.medication.update({
                    where: { id: rxItem.medication.id },
                    data: { stockAvailable: { decrement: qtyToDispenseThisTime } }
                });
                await tx.prescriptionItem.update({
                    where: { id: rxItem.id },
                    data: { dispensedQty: newTotalDispensed }
                });
                if (rx.admissionId) {
                    const itemTotal = Number(rxItem.medication.unitPrice) * qtyToDispenseThisTime;
                    totalAmountToBill += itemTotal;
                    billedItemsToCreate.push({
                        serviceId: rxItem.medication.id,
                        serviceName: `Pharmacy: ${rxItem.medication.drugName}`,
                        serviceCode: `PHARM-${rxItem.medication.id.substring(0, 6)}`,
                        quantity: qtyToDispenseThisTime,
                        unitPrice: rxItem.medication.unitPrice,
                        totalPrice: itemTotal,
                        discountPercent: 0,
                        discountAmount: 0,
                        taxPercent: 0,
                        taxAmount: 0,
                    });
                }
            }
            const newStatus = allFullyDispensed ? 'DISPENSED' : 'PARTIAL';
            await tx.prescription.update({
                where: { id },
                data: {
                    status: newStatus,
                    dispensedAt: new Date(),
                    dispensedBy
                }
            });
            if (rx.admissionId && billedItemsToCreate.length > 0) {
                const activeBill = await tx.bill.findFirst({
                    where: { admissionId: rx.admissionId, status: 'DRAFT' },
                    orderBy: { createdAt: 'desc' }
                });
                if (activeBill) {
                    await tx.billItem.createMany({
                        data: billedItemsToCreate.map(item => ({
                            ...item,
                            billId: activeBill.id,
                        }))
                    });
                    await tx.bill.update({
                        where: { id: activeBill.id },
                        data: {
                            totalAmount: { increment: totalAmountToBill },
                            netAmount: { increment: totalAmountToBill },
                            dueAmount: { increment: totalAmountToBill }
                        }
                    });
                }
            }
            return { success: true, newStatus };
        });
    }
    async returnPrescription(id, returnedBy) {
        return this.prisma.$transaction(async (tx) => {
            const rx = await tx.prescription.findUnique({
                where: { id },
                include: { items: { include: { medication: true } } }
            });
            if (!rx)
                throw new common_1.NotFoundException('Prescription not found');
            if (rx.status !== 'DISPENSED' && rx.status !== 'PARTIAL') {
                throw new common_1.BadRequestException('Can only return dispensed prescriptions');
            }
            let totalAmountToRefund = 0;
            const billedItemsToCreate = [];
            for (const item of rx.items) {
                if (item.dispensedQty > 0) {
                    await tx.medication.update({
                        where: { id: item.medication.id },
                        data: { stockAvailable: { increment: item.dispensedQty } }
                    });
                    if (rx.admissionId) {
                        const refundTotal = Number(item.medication.unitPrice) * item.dispensedQty;
                        totalAmountToRefund += refundTotal;
                        billedItemsToCreate.push({
                            serviceId: item.medication.id,
                            serviceName: `Pharmacy Return: ${item.medication.drugName}`,
                            serviceCode: `RET-${item.medication.id.substring(0, 6)}`,
                            quantity: -item.dispensedQty,
                            unitPrice: item.medication.unitPrice,
                            totalPrice: -refundTotal,
                            discountPercent: 0, discountAmount: 0, taxPercent: 0, taxAmount: 0,
                        });
                    }
                    await tx.prescriptionItem.update({
                        where: { id: item.id },
                        data: { dispensedQty: 0 }
                    });
                }
            }
            if (rx.admissionId && billedItemsToCreate.length > 0) {
                const activeBill = await tx.bill.findFirst({
                    where: { admissionId: rx.admissionId, status: { in: ['DRAFT', 'PARTIALLY_PAID'] } },
                    orderBy: { createdAt: 'desc' }
                });
                if (activeBill) {
                    await tx.billItem.createMany({
                        data: billedItemsToCreate.map(item => ({ ...item, billId: activeBill.id }))
                    });
                    await tx.bill.update({
                        where: { id: activeBill.id },
                        data: {
                            totalAmount: { decrement: totalAmountToRefund },
                            netAmount: { decrement: totalAmountToRefund },
                            dueAmount: { decrement: totalAmountToRefund }
                        }
                    });
                }
            }
            await tx.prescription.update({
                where: { id },
                data: { status: 'RETURNED' }
            });
            return { success: true };
        });
    }
    async getStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalActive, pending, partial, dispensedToday, urgentCount] = await Promise.all([
            this.prisma.prescription.count(),
            this.prisma.prescription.count({ where: { status: 'PENDING' } }),
            this.prisma.prescription.count({ where: { status: 'PARTIAL' } }),
            this.prisma.prescription.count({
                where: { status: 'DISPENSED', dispensedAt: { gte: today } }
            }),
            this.prisma.prescription.count({
                where: {
                    status: { in: ['PENDING', 'PARTIAL'] },
                    admission: {
                        currentBed: { ward: { type: { in: ['NICU', 'PICU'] } } }
                    }
                }
            })
        ]);
        const allMeds = await this.prisma.medication.findMany({ select: { stockAvailable: true, reorderLevel: true } });
        const lowStockCount = allMeds.filter((m) => m.stockAvailable <= m.reorderLevel).length;
        return {
            totalActive,
            pending,
            partial,
            dispensedToday,
            lowStockCount,
            urgentCount
        };
    }
    async getLowStockInventory() {
        const meds = await this.prisma.medication.findMany({
            include: {
                adjustments: {
                    where: { expiryDate: { not: null } },
                    select: { expiryDate: true }
                }
            }
        });
        const lowStock = meds.filter((m) => m.stockAvailable <= m.reorderLevel);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        const withSeverity = lowStock.map((m) => {
            let severity = 'LOW';
            if (m.stockAvailable === 0) {
                severity = 'CRITICAL';
            }
            else if (m.stockAvailable <= m.reorderLevel / 2) {
                severity = 'WARNING';
            }
            const suggestedOrderQty = Math.max(0, (m.reorderLevel * 2) - m.stockAvailable);
            let earliestExpiry = null;
            let expiringSoon = false;
            if (m.adjustments && m.adjustments.length > 0) {
                const futureExpiries = m.adjustments
                    .map((adj) => adj.expiryDate)
                    .filter((date) => date > new Date())
                    .sort((a, b) => a.getTime() - b.getTime());
                if (futureExpiries.length > 0) {
                    earliestExpiry = futureExpiries[0];
                    if (earliestExpiry && earliestExpiry <= thirtyDaysFromNow) {
                        expiringSoon = true;
                    }
                }
            }
            const { adjustments, ...rest } = m;
            return {
                ...rest,
                severity,
                deficit: m.reorderLevel - m.stockAvailable,
                suggestedOrderQty,
                earliestExpiry,
                expiringSoon
            };
        });
        return withSeverity.sort((a, b) => b.deficit - a.deficit);
    }
    async checkClearance(admissionId) {
        const pendingRx = await this.prisma.prescription.findMany({
            where: {
                admissionId,
                status: { in: ['PENDING', 'PARTIAL'] }
            },
            select: {
                id: true,
                prescriptionNumber: true,
                status: true,
                orderedAt: true,
            }
        });
        return {
            cleared: pendingRx.length === 0,
            pendingPrescriptions: pendingRx
        };
    }
    async adjustStock(medicationId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const medication = await tx.medication.findUnique({
                where: { id: medicationId },
                select: { id: true, stockAvailable: true, drugName: true }
            });
            if (!medication) {
                throw new Error('Medication not found');
            }
            const newStock = medication.stockAvailable + dto.quantity;
            if (newStock < 0) {
                throw new Error(`Insufficient stock for ${medication.drugName}. Current: ${medication.stockAvailable}, Attempted deduction: ${Math.abs(dto.quantity)}`);
            }
            const adjustmentType = dto.quantity > 0 ? 'RESTOCK' : 'WRITE_OFF';
            const adjustment = await tx.stockAdjustment.create({
                data: {
                    medicationId,
                    adjustmentType,
                    quantity: dto.quantity,
                    batchNumber: dto.batchNumber,
                    reason: dto.reason,
                    performedBy: dto.performedBy
                }
            });
            await tx.medication.update({
                where: { id: medicationId },
                data: { stockAvailable: newStock }
            });
            return adjustment;
        });
    }
};
exports.PharmacyService = PharmacyService;
exports.PharmacyService = PharmacyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PharmacyService);
//# sourceMappingURL=pharmacy.service.js.map