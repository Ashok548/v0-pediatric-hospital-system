import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { prisma } from '@carenest/database';
import { BillStatus } from '@carenest/database';

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

        // Guard: If a non-cancelled bill already exists for this OP visit, do not create a duplicate
        const existingBill = await prisma.bill.findFirst({
            where: { opVisitId, status: { not: BillStatus.CANCELLED } }
        });

        if (existingBill) {
            this.logger.debug(`Bill ${existingBill.billNumber} already exists for OPVisit ${opVisitId} — skipping.`);
            return;
        }

        // Auto-generate bill number inside a transaction
        await prisma.$transaction(async (tx: any) => {
            const year = new Date().getFullYear();
            const seqUpdated = await tx.$executeRaw`
                UPDATE bill_sequences SET last_value = last_value + 1, updated_at = NOW() WHERE id = 1 AND year = ${year}
            `;
            if (seqUpdated === 0) {
                await tx.billSequence.upsert({
                    where: { id_year: { id: 1, year } },
                    update: { year, lastValue: 1 },
                    create: { id: 1, year, lastValue: 1 },
                });
            }
            const billSeq = await tx.billSequence.findUnique({ where: { id_year: { id: 1, year } } });
            const billNumber = `BILL-${year}-${String(billSeq!.lastValue).padStart(6, '0')}`;

            const newBill = await tx.bill.create({
                data: {
                    billNumber,
                    patientId,
                    opVisitId,
                    status: BillStatus.DRAFT,
                    totalAmount: 0, discountAmount: 0, taxAmount: 0, netAmount: 0, paidAmount: 0, dueAmount: 0,
                }
            });

            await tx.auditLog.create({
                data: {
                    entity: 'Bill', entityId: newBill.id, action: 'AUTO_CREATE',
                    oldValue: null, newValue: BillStatus.DRAFT,
                    userId: payload.doctorId
                }
            });

            this.logger.log(`Auto-created DRAFT bill ${billNumber} for OPVisit ${opVisitId}`);
        });
    }
}
