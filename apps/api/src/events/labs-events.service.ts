import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { prisma } from '@carenest/database';

interface FinancialClearanceGrantedPayload {
    billId: string;
    opVisitId?: string;
    patientId: string;
    clearedLineItemIds: string[];
}

/**
 * Listens for the 'FinancialClearanceGranted' event dispatched by the OutboxService poller.
 * Advances PENDING_CLEARANCE lab orders tied to the OP Visit to AWAITING_SAMPLE,
 * making them appear in the Phlebotomist worklist.
 */
@Injectable()
export class LabsEventsService {
    private readonly logger = new Logger(LabsEventsService.name);

    @OnEvent('FinancialClearanceGranted')
    async handleFinancialClearanceGranted(payload: FinancialClearanceGrantedPayload): Promise<void> {
        const { opVisitId, billId } = payload;
        this.logger.log(`Received FinancialClearanceGranted event for bill ${billId}`);

        if (!opVisitId) {
            this.logger.debug('No opVisitId in FinancialClearanceGranted payload — only OP visits supported currently.');
            return;
        }

        // Find all PENDING_CLEARANCE lab orders linked to this OP visit
        const pendingOrders = await prisma.labOrder.findMany({
            where: { opVisitId, status: 'PENDING_CLEARANCE' },
            select: { id: true }
        });

        if (pendingOrders.length === 0) {
            this.logger.debug(`No PENDING_CLEARANCE lab orders for OPVisit ${opVisitId}`);
            return;
        }

        this.logger.log(`Advancing ${pendingOrders.length} lab order(s) to AWAITING_SAMPLE for OPVisit ${opVisitId}`);

        for (const order of pendingOrders) {
            await prisma.$transaction(async (tx: any) => {
                await tx.labOrder.update({
                    where: { id: order.id },
                    data: { status: 'AWAITING_SAMPLE' }
                });
                await tx.auditLog.create({
                    data: {
                        entity: 'LabOrder', entityId: order.id, action: 'STATUS_CHANGE',
                        oldValue: 'PENDING_CLEARANCE', newValue: 'AWAITING_SAMPLE',
                        userId: null // System-driven event
                    }
                });
            });
        }
    }
}
