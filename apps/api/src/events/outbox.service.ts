import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { prisma } from '@carenest/database';

const MAX_RETRIES = 3;

@Injectable()
export class OutboxService {
    private readonly logger = new Logger(OutboxService.name);

    constructor(private readonly eventEmitter: EventEmitter2) {}

    /**
     * Polls for PENDING outbox events every 5 seconds.
     * Dispatches them via NestJS EventEmitter, then marks them PROCESSED.
     * After MAX_RETRIES failures, marks the event DEAD_LETTERED.
     */
    @Cron(CronExpression.EVERY_5_SECONDS)
    async processOutboxEvents(): Promise<void> {
        // Fix NEW-5: PostgreSQL does not allow FOR UPDATE SKIP LOCKED inside a subquery of an UPDATE.
        // Use a CTE (WITH ... AS) which is the correct and only valid pattern for this.
        // Fix GAP-1: $queryRaw returns rows (not row count)
        // Fix GAP-12: reclaim stuck PROCESSING events older than 2 minutes
        const claimedEvents = await prisma.$queryRaw<any[]>`
            WITH claimed AS (
                SELECT id FROM outbox_events
                WHERE (status IN ('PENDING', 'FAILED') AND retry_count < ${MAX_RETRIES})
                   OR (status = 'PROCESSING' AND updated_at < NOW() - INTERVAL '2 minutes')
                ORDER BY created_at ASC
                LIMIT 50
                FOR UPDATE SKIP LOCKED
            )
            UPDATE outbox_events
            SET status = 'PROCESSING', updated_at = NOW()
            FROM claimed
            WHERE outbox_events.id = claimed.id
            RETURNING outbox_events.id,
                      outbox_events.event_type     AS "eventType",
                      outbox_events.payload,
                      outbox_events.retry_count    AS "retryCount";
        `;

        if (!claimedEvents || claimedEvents.length === 0) return;

        this.logger.debug(`Processing ${claimedEvents.length} outbox event(s)...`);

        for (const event of claimedEvents) {
            try {
                // Dispatch the event — listeners registered via @OnEvent() will pick this up
                await this.eventEmitter.emitAsync(event.eventType, event.payload);

                await prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: { status: 'PROCESSED', processedAt: new Date() },
                });

                this.logger.log(`Outbox event [${event.eventType}] processed successfully.`);
            } catch (err: any) {
                const newRetryCount = event.retryCount + 1;
                const isDead = newRetryCount >= MAX_RETRIES;

                await prisma.outboxEvent.update({
                    where: { id: event.id },
                    data: {
                        status: isDead ? 'DEAD_LETTERED' : 'FAILED',
                        retryCount: newRetryCount,
                        errorReason: err?.message ?? 'Unknown error',
                    },
                });

                this.logger.error(
                    `Outbox event [${event.eventType}] failed (attempt ${newRetryCount}/${MAX_RETRIES}): ${err?.message}`,
                    isDead ? '→ Moved to DEAD_LETTERED' : '→ Will retry',
                );
            }
        }
    }

    async getDeadLetters() {
        return prisma.outboxEvent.findMany({
            where: { status: 'DEAD_LETTERED' },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }

    async replayEvent(id: string) {
        const event = await prisma.outboxEvent.findUnique({ where: { id } });
        if (!event) throw new NotFoundException(`Outbox event ${id} not found`);
        return prisma.outboxEvent.update({
            where: { id },
            data: { status: 'PENDING', retryCount: 0, errorReason: null },
        });
    }
}
