import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { BillingEventsService } from './billing-events.service';
import { LabsEventsService } from './labs-events.service';

@Module({
    providers: [OutboxService, BillingEventsService, LabsEventsService],
    exports: [OutboxService],
})
export class OutboxModule {}
