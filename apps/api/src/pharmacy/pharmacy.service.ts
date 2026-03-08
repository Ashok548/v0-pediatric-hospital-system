import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, PrescriptionStatus } from '@carenest/database';
import { CreatePrescriptionDto, DispensePrescriptionDto } from './dto/pharmacy.dto';

@Injectable()
export class PharmacyService {
    private readonly prisma = prisma;

    constructor() { }

    async getInventory() {
        return this.prisma.medication.findMany({
            orderBy: { drugName: 'asc' },
        });
    }

    async getPrescriptions(query: { status?: PrescriptionStatus; search?: string; admissionId?: string }) {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.admissionId) where.admissionId = query.admissionId;

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

    async getPrescription(id: string) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { id },
            include: {
                patient: true,
                admission: { include: { currentBed: { include: { ward: true } } } },
                doctor: true,
                items: { include: { medication: true } },
            }
        });
        if (!prescription) throw new NotFoundException('Prescription not found');
        return prescription;
    }

    async createPrescription(dto: CreatePrescriptionDto) {
        return this.prisma.$transaction(async (tx: any) => {
            // 1. Generate unique prescription number
            const currentYear = new Date().getFullYear();
            const seq = await tx.prescriptionSequence.upsert({
                where: { id_year: { id: 1, year: currentYear } },
                update: { lastValue: { increment: 1 } },
                create: { id: 1, year: currentYear, lastValue: 1 },
            });
            const rxNumber = `RX-${currentYear}-${seq.lastValue.toString().padStart(6, '0')}`;

            // 2. Create Prescription
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

    async dispensePrescription(id: string, dto: DispensePrescriptionDto, dispensedBy: string) {
        return this.prisma.$transaction(async (tx: any) => {
            const rx = await tx.prescription.findUnique({
                where: { id },
                include: { items: { include: { medication: true } } }
            });

            if (!rx) throw new NotFoundException('Prescription not found');
            if (rx.status === 'DISPENSED' || rx.status === 'RETURNED' || rx.status === 'CANCELLED') {
                throw new BadRequestException(`Cannot dispense prescription in ${rx.status} status`);
            }

            let allFullyDispensed = true;
            let totalAmountToBill = 0;
            const billedItemsToCreate = [];

            // Process each item
            for (const rxItem of rx.items) {
                const dispenseInput = dto.items.find(i => i.prescriptionItemId === rxItem.id);
                if (!dispenseInput) {
                    allFullyDispensed = false;
                    continue;
                }

                const qtyToDispenseThisTime = dispenseInput.dispensedQty;
                if (qtyToDispenseThisTime <= 0) continue; // No new dispensing

                if (rxItem.medication.stockAvailable < qtyToDispenseThisTime) {
                    throw new BadRequestException(`Insufficient stock for ${rxItem.medication.drugName}. Available: ${rxItem.medication.stockAvailable}, Requested: ${qtyToDispenseThisTime}`);
                }

                const newTotalDispensed = rxItem.dispensedQty + qtyToDispenseThisTime;
                if (newTotalDispensed < rxItem.prescribedQty) {
                    allFullyDispensed = false;
                }

                // 1. Deduct Stock
                await tx.medication.update({
                    where: { id: rxItem.medication.id },
                    data: { stockAvailable: { decrement: qtyToDispenseThisTime } }
                });

                // 2. Update Prescription Item
                await tx.prescriptionItem.update({
                    where: { id: rxItem.id },
                    data: { dispensedQty: newTotalDispensed }
                });

                // 3. Prepare Bill Item (if IP admission exists)
                if (rx.admissionId) {
                    const itemTotal = Number(rxItem.medication.unitPrice) * qtyToDispenseThisTime;
                    totalAmountToBill += itemTotal;
                    billedItemsToCreate.push({
                        serviceId: rxItem.medication.id, // using medication ID as service ID
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

            // 4. Update Prescription Status
            const newStatus = allFullyDispensed ? 'DISPENSED' : 'PARTIAL';
            await tx.prescription.update({
                where: { id },
                data: {
                    status: newStatus,
                    dispensedAt: new Date(),
                    dispensedBy
                }
            });

            // 5. Post charges to IP Bill automatically
            if (rx.admissionId && billedItemsToCreate.length > 0) {
                // Find active draft bill for this admission
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

                    // Update bill totals
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

    async returnPrescription(id: string, returnedBy: string) {
        return this.prisma.$transaction(async (tx: any) => {
            const rx = await tx.prescription.findUnique({
                where: { id },
                include: { items: { include: { medication: true } } }
            });

            if (!rx) throw new NotFoundException('Prescription not found');
            if (rx.status !== 'DISPENSED' && rx.status !== 'PARTIAL') {
                throw new BadRequestException('Can only return dispensed prescriptions');
            }

            let totalAmountToRefund = 0;
            const billedItemsToCreate = []; // creating negative lines for refund

            for (const item of rx.items) {
                if (item.dispensedQty > 0) {
                    // 1. Restock
                    await tx.medication.update({
                        where: { id: item.medication.id },
                        data: { stockAvailable: { increment: item.dispensedQty } }
                    });

                    // 2. Prepare refund line (if IP admission)
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

                    // 3. Reset dispensed qty
                    await tx.prescriptionItem.update({
                        where: { id: item.id },
                        data: { dispensedQty: 0 }
                    });
                }
            }

            // 4. Post refunds to IP Bill
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

        const [totalActive, pending, partial, dispensedToday, lowStockCount, urgentCount] = await Promise.all([
            this.prisma.prescription.count(),
            this.prisma.prescription.count({ where: { status: 'PENDING' } }),
            this.prisma.prescription.count({ where: { status: 'PARTIAL' } }),
            this.prisma.prescription.count({
                where: { status: 'DISPENSED', dispensedAt: { gte: today } }
            }),
            this.prisma.medication.count({
                where: { stockAvailable: { lte: 10 } } // Hardcoded threshold for low stock alert
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

        return {
            totalActive,
            pending,
            partial,
            dispensedToday,
            lowStockCount,
            urgentCount
        };
    }

    async checkClearance(admissionId: string) {
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
}
