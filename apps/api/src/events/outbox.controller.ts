import { Controller, Get, Post, Param, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OutboxService } from './outbox.service';

@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
@Controller('admin/outbox')
export class OutboxController {
    constructor(private readonly outboxService: OutboxService) {}

    @Get('dead-letters')
    getDeadLetters() {
        return this.outboxService.getDeadLetters();
    }

    @Post(':id/replay')
    replayEvent(@Param('id') id: string) {
        return this.outboxService.replayEvent(id);
    }
}
