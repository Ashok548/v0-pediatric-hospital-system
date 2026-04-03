import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma, PrescriptionStatus, MasterStatus } from '@carenest/database';
import { CreatePrescriptionDto, DispensePrescriptionDto, CreateMedicationDto, BulkCreateMedicationsDto, UpdateMedicationDto } from './dto/pharmacy.dto';
import { nextSequenceValue } from '../common/sequence.util';

const PHARMACY_SERVICE_CODE = 'PHARM-DISPENSE';

let _pharmacyServiceId: string | null = null;
async function getPharmacyServiceId(): Promise<string> {
    if (_pharmacyServiceId !== null) return _pharmacyServiceId;
    const svc = await prisma.service.findUnique({ where: { code: PHARMACY_SERVICE_CODE } });
    if (!svc) throw new Error('PHARM-DISPENSE master service not found. Run db seed first.');
    _pharmacyServiceId = svc.id;
    return svc.id;
}

@Injectable()
export class PharmacyService {
    private readonly prisma = prisma;

    constructor() { }

    async getInventory() {
        return this.prisma.medication.findMany({
            orderBy: { drugName: 'asc' },
        });
    }

    async createMedication(dto: CreateMedicationDto) {
        // Build generic code for standard unique identification if needed. For now, rely on UUID.
        return this.prisma.medication.create({
            data: {
                ...dto,
                status: 'ACTIVE',
            }
        });
    }

    async bulkCreateMedications(dto: BulkCreateMedicationsDto) {
        const data = dto.medications.map(med => ({
            ...med,
            status: 'ACTIVE' as const,
        }));
        
        // Use createMany to insert. Prisma doesn't return the full objects from createMany, 
        // just the count. The user can refresh the inventory using getInventory.
        const result = await this.prisma.medication.createMany({
            data,
            skipDuplicates: true, // Safety measure if unique constraints are added later
        });
        
        return { success: true, count: result.count };
    }

    async updateMedication(id: string, dto: UpdateMedicationDto) {
        try {
            return await this.prisma.medication.update({
                where: { id },
                data: dto,
            });
        } catch (error) {
            throw new NotFoundException('Medication not found');
        }
    }

    async deactivateMedication(id: string) {
        // Fix RESIDUAL-1: Wrap count + update in one transaction to eliminate TOCTOU race.
        // Without this, a new prescription could be created between the count check and the deactivation.
        return this.prisma.$transaction(async (tx: any) => {
            const medication = await tx.medication.findUnique({ where: { id } });
            if (!medication) throw new NotFoundException('Medication not found');

            const pending = await tx.prescriptionItem.count({
                where: {
                    medicationId: id,
                    prescription: { status: { in: ['PENDING', 'PARTIAL'] } }
                }
            });

            if (pending > 0) {
                throw new BadRequestException(`Cannot deactivate: ${pending} pending/partial prescriptions use this medication.`);
            }

            return tx.medication.update({
                where: { id },
                data: { status: 'INACTIVE' },
            });
        });
    }


    async getPrescriptions(query: { status?: PrescriptionStatus; search?: string; admissionId?: string; patientId?: string }) {
        const where: any = {};
        if (query.status) where.status = query.status;
        if (query.admissionId) where.admissionId = query.admissionId;
        if (query.patientId) where.patientId = query.patientId;

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
            // Fix NEW-1: Use the canonical nextSequenceValue atomic helper (INSERT ... ON CONFLICT RETURNING)
            // instead of the racy Prisma upsert pattern which had a two-trip SELECT race.
            const currentYear = new Date().getFullYear();
            const seqVal = await nextSequenceValue(tx, 'prescription_sequences', currentYear);
            const rxNumber = `RX-${currentYear}-${String(seqVal).padStart(6, '0')}`;

            // 2. Create Prescription
            return tx.prescription.create({
                data: {
                    prescriptionNumber: rxNumber,
                    patientId: dto.patientId,
                    admissionId: dto.admissionId,
                    opVisitId: dto.opVisitId,
                    doctorId: dto.doctorId,
                    notes: dto.notes,
                    status: 'PENDING',
                    items: {
                        create: dto.items.map(item => ({
                            medicationId: item.medicationId,
                            prescribedQty: item.prescribedQty,
                            dose: item.dose,
                            frequency: item.frequency,
                            duration: item.duration,
                            instructions: item.instructions,
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

                const newTotalDispensed = rxItem.dispensedQty + qtyToDispenseThisTime;
                if (newTotalDispensed < rxItem.prescribedQty) {
                    allFullyDispensed = false;
                }

                // 1. Deduct Stock - Atomic conditional decrement
                const stockResult: number = await tx.$executeRaw`
                    UPDATE medications
                    SET stock_available = stock_available - ${qtyToDispenseThisTime},
                        updated_at = NOW()
                    WHERE id = ${rxItem.medication.id}
                      AND stock_available >= ${qtyToDispenseThisTime}
                `;
                if (stockResult === 0) {
                    throw new BadRequestException(
                        `Insufficient stock for ${rxItem.medication.drugName}. ` +
                        `Requested: ${qtyToDispenseThisTime} — stock may have changed. Please refresh and retry.`
                    );
                }

                // 2. Update Prescription Item
                await tx.prescriptionItem.update({
                    where: { id: rxItem.id },
                    data: { dispensedQty: newTotalDispensed }
                });

                // 3. Prepare Bill Item (if IP admission exists)
                if (rx.admissionId) {
                    const pharmServiceId = await getPharmacyServiceId();
                    const itemTotal = Number(rxItem.medication.unitPrice) * qtyToDispenseThisTime;
                    totalAmountToBill += itemTotal;
                    billedItemsToCreate.push({
                        serviceId: pharmServiceId,
                        serviceName: `Pharmacy: ${rxItem.medication.drugName} (${rxItem.medication.strength})`,
                        serviceCode: `RX-${rxItem.medication.id.substring(0, 8).toUpperCase()}`,
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

                    // Recalculate all totals properly
                    const allItems = await tx.billItem.findMany({ where: { billId: activeBill.id } });
                    let totalAmt = 0, discAmt = 0, taxAmt = 0, netAmt = 0;
                    for (const item of allItems) {
                        const gross = parseFloat(item.unitPrice.toString()) * item.quantity;
                        const disc = gross * parseFloat(item.discountPercent.toString()) / 100;
                        const preTax = gross - disc;
                        const tax = preTax * parseFloat(item.taxPercent.toString()) / 100;
                        totalAmt += gross; discAmt += disc; taxAmt += tax; netAmt += preTax + tax;
                    }
                    const payments = await tx.payment.findMany({ where: { billId: activeBill.id } });
                    const paidAmt = payments.reduce((s: number, p: any) => s + parseFloat(p.amount.toString()), 0);
                    
                    await tx.bill.update({
                        where: { id: activeBill.id },
                        data: { totalAmount: totalAmt, discountAmount: discAmt, taxAmount: taxAmt, netAmount: netAmt, paidAmount: paidAmt, dueAmount: Math.max(0, netAmt - paidAmt) }
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
                        const pharmServiceId = await getPharmacyServiceId();
                        const refundTotal = Number(item.medication.unitPrice) * item.dispensedQty;
                        totalAmountToRefund += refundTotal;
                        billedItemsToCreate.push({
                            serviceId: pharmServiceId,
                            serviceName: `Pharmacy Return: ${item.medication.drugName} (${item.medication.strength})`,
                            serviceCode: `RET-${item.medication.id.substring(0, 8).toUpperCase()}`,
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

                    // Recalculate all totals properly (handles tax/discount correctly)
                    const allItems = await tx.billItem.findMany({ where: { billId: activeBill.id } });
                    let totalAmt = 0, discAmt = 0, taxAmt = 0, netAmt = 0;
                    for (const item of allItems) {
                        const gross = parseFloat(item.unitPrice.toString()) * item.quantity;
                        const disc = gross * parseFloat(item.discountPercent.toString()) / 100;
                        const preTax = gross - disc;
                        const tax = preTax * parseFloat(item.taxPercent.toString()) / 100;
                        totalAmt += gross; discAmt += disc; taxAmt += tax; netAmt += preTax + tax;
                    }
                    const payments = await tx.payment.findMany({ where: { billId: activeBill.id } });
                    const paidAmt = payments.reduce((s: number, p: any) => s + parseFloat(p.amount.toString()), 0);
                    
                    await tx.bill.update({
                        where: { id: activeBill.id },
                        data: { totalAmount: totalAmt, discountAmount: discAmt, taxAmount: taxAmt, netAmount: netAmt, paidAmount: paidAmt, dueAmount: Math.max(0, netAmt - paidAmt) }
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

        // Dynamic low stock count
        // Prisma doesn't support comparing column vs column in basic counts easily, so we fetch needed fields.
        const allMeds = await this.prisma.medication.findMany({ select: { stockAvailable: true, reorderLevel: true } });
        const lowStockCount = allMeds.filter((m: { stockAvailable: number; reorderLevel: number }) => m.stockAvailable <= m.reorderLevel).length;

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
        // Fetch meds with their stock adjustments to check for expiries
        const meds = await this.prisma.medication.findMany({
            include: {
                adjustments: {
                    where: { expiryDate: { not: null } },
                    select: { expiryDate: true }
                }
            }
        });

        const lowStock = meds.filter((m: any) => m.stockAvailable <= m.reorderLevel);

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const withSeverity = lowStock.map((m: any) => {
            let severity: 'CRITICAL' | 'WARNING' | 'LOW' = 'LOW';
            if (m.stockAvailable === 0) {
                severity = 'CRITICAL';
            } else if (m.stockAvailable <= m.reorderLevel / 2) {
                severity = 'WARNING';
            }

            // Calculate suggested order quantity
            const suggestedOrderQty = Math.max(0, (m.reorderLevel * 2) - m.stockAvailable);

            // Determine earliest expiry date from adjustments
            let earliestExpiry: Date | null = null;
            let expiringSoon = false;

            if (m.adjustments && m.adjustments.length > 0) {
                // Find the closest expiry date that is in the future
                const futureExpiries = m.adjustments
                    .map((adj: any) => adj.expiryDate)
                    .filter((date: Date) => date > new Date())
                    .sort((a: Date, b: Date) => a.getTime() - b.getTime());

                if (futureExpiries.length > 0) {
                    earliestExpiry = futureExpiries[0];
                    if (earliestExpiry && earliestExpiry <= thirtyDaysFromNow) {
                        expiringSoon = true;
                    }
                }
            }

            // omit adjustments list from output
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

        // Sort by largest deficit first
        return withSeverity.sort((a: any, b: any) => b.deficit - a.deficit);
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

    async adjustStock(medicationId: string, dto: { quantity: number; batchNumber?: string; reason?: string; performedBy: string }) {
        return this.prisma.$transaction(async (tx: any) => {
            const medication = await tx.medication.findUnique({
                where: { id: medicationId },
                select: { id: true, stockAvailable: true, drugName: true }
            });

            if (!medication) {
                throw new NotFoundException('Medication not found');
            }

            const adjustmentType = dto.quantity > 0 ? 'RESTOCK' : 'WRITE_OFF';

            // Fix RESIDUAL-3: For write-offs (negative qty), use atomic conditional SQL UPDATE
            // to prevent concurrent over-deduction — same pattern as dispensePrescription.
            if (dto.quantity < 0) {
                const absQty = Math.abs(dto.quantity);
                const affected: number = await tx.$executeRaw`
                    UPDATE medications
                    SET stock_available = stock_available - ${absQty},
                        updated_at = NOW()
                    WHERE id = ${medicationId}
                      AND stock_available >= ${absQty}
                `;
                if (affected === 0) {
                    throw new BadRequestException(
                        `Insufficient stock for ${medication.drugName}. ` +
                        `Requested deduction: ${absQty}. Refresh and retry.`
                    );
                }
            } else {
                // Restocks are always safe — no contention risk
                await tx.medication.update({
                    where: { id: medicationId },
                    data: { stockAvailable: { increment: dto.quantity } },
                });
            }

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

            return adjustment;
        });
    }
}
