import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { prisma } from '@carenest/database';
import { BillStatus } from '@carenest/database';
import { nextSequenceValue } from '../common/sequence.util';

interface OrdersSignedPayload {
    consultationId: string;
    opVisitId?: string;
    patientId: string;
    doctorId: string;
}

/**
 * Listens for the 'OrdersSigned' event dispatched by the OutboxService poller.
 * Auto-creates a DRAFT bill for the OP Visit if one doesn't already exist.
 */
@Injectable()
export class BillingEventsService {
    private readonly logger = new Logger(BillingEventsService.name);

    @OnEvent('OrdersSigned')
    async handleOrdersSigned(payload: OrdersSignedPayload): Promise<void> {
        const { opVisitId, patientId, consultationId } = payload;
        this.logger.log(`Received OrdersSigned event for consultation ${consultationId}`);

        // Only auto-create a bill if the consultation is linked to an OP visit
        if (!opVisitId) {
            this.logger.debug('No opVisitId in OrdersSigned payload — skipping auto-bill creation.');
            return;
        }

        // Fix RESIDUAL-2: Move the idempotency check INSIDE the transaction.
        // The previous pattern had a TOCTOU race: two concurrent OrdersSigned events for the same
        // opVisitId could both pass the outer findFirst check and then both create a bill.
        // Inside the transaction we lock the oPVisit row first (SELECT FOR UPDATE via $executeRaw),
        // ensuring only one concurrent path can proceed.
        await prisma.$transaction(async (tx: any) => {
            // Acquire row-level lock on the OP visit to serialize concurrent events
            await tx.$executeRaw`SELECT id FROM op_visits WHERE id = ${opVisitId} FOR UPDATE`;

            // Re-check inside the transaction — this is now safe against concurrent events
            const existingBill = await tx.bill.findFirst({
                where: { opVisitId, status: { not: BillStatus.CANCELLED } }
            });

            if (existingBill) {
                this.logger.debug(`Bill ${existingBill.billNumber} already exists for OPVisit ${opVisitId} — skipping.`);
                return;
            }

            const year = new Date().getFullYear();
            const seqVal = await nextSequenceValue(tx, 'bill_sequences', year);
            const billNumber = `BILL-${year}-${String(seqVal).padStart(6, '0')}`;

            const newBill = await tx.bill.create({
                data: {
                    billNumber,
                    patientId,
                    opVisitId,
                    status: BillStatus.DRAFT,
                    totalAmount: 0, discountAmount: 0, taxAmount: 0, netAmount: 0, paidAmount: 0, dueAmount: 0,
                }
            });

            let auditUserId = payload.doctorId;

            // Auto-add ON_OP_CREATION services for the visit's department
            const visit = await tx.oPVisit.findUnique({
                where: { id: opVisitId },
                include: { doctor: { select: { name: true, consultationFee: true } } }
            });

            if (visit) {
                let billGross = 0;
                let billTax = 0;

                const autoServices = await tx.service.findMany({
                    where: {
                        autoAddTrigger: 'ON_OP_CREATION',
                        isDefault: true,
                        status: 'ACTIVE',
                        departments: { some: { department: { name: visit.department } } }
                    },
                    orderBy: { autoAddPriority: 'asc' }
                });

                for (const svc of autoServices) {
                    const price = parseFloat(svc.basePrice.toString());
                    const tax = price * parseFloat(svc.taxPercent.toString()) / 100;
                    await tx.billItem.create({
                        data: {
                            billId: newBill.id,
                            serviceId: svc.id,
                            serviceName: svc.name,
                            serviceCode: svc.code,
                            quantity: 1,
                            unitPrice: price,
                            discountPercent: 0,
                            discountAmount: 0,
                            taxPercent: parseFloat(svc.taxPercent.toString()),
                            taxAmount: tax,
                            totalPrice: price + tax,
                        }
                    });
                    billGross += price;
                    billTax += tax;
                }

                // Update bill totals
                const netAmount = billGross + billTax;
                if (netAmount > 0) {
                    await tx.bill.update({
                        where: { id: newBill.id },
                        data: { 
                            totalAmount: billGross, 
                            taxAmount: billTax, 
                            netAmount: netAmount, 
                            dueAmount: netAmount 
                        }
                    });
                }
            }

            await tx.auditLog.create({
                data: {
                    entity: 'Bill', entityId: newBill.id, action: 'AUTO_CREATE',
                    oldValue: null, newValue: BillStatus.DRAFT,
                    userId: auditUserId
                }
            });

            this.logger.log(`Auto-created DRAFT bill ${billNumber} for OPVisit ${opVisitId}`);
        });
    }
}
