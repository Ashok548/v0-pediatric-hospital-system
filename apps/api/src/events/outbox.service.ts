import { Injectable, Logger } from '@nestjs/common';
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
        const events = await prisma.outboxEvent.findMany({
            where: {
                status: { in: ['PENDING', 'FAILED'] },
                retryCount: { lt: MAX_RETRIES },
            },
            orderBy: { createdAt: 'asc' },
            take: 50,
        });

        if (events.length === 0) return;

        this.logger.debug(`Processing ${events.length} outbox event(s)...`);

        for (const event of events) {
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
}
