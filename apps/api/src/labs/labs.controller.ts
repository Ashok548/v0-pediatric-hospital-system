import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, Query } from '@nestjs/common';
import { LabsService } from './labs.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabPanelResultsDto } from './dto/update-lab-results.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export class RejectSampleDto {
    reason: string;
}

@UseGuards(JwtAuthGuard)
@Controller('labs')
export class LabsController {
    constructor(private readonly labsService: LabsService) { }

    @Post('orders')
    createOrder(@Body() createLabOrderDto: CreateLabOrderDto, @Request() req: any) {
        return this.labsService.createOrder(createLabOrderDto, req.user.id);
    }

    @Get('orders')
    findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.labsService.findAll(page, limit);
    }

    @Get('orders/patient/:patientId')
    findByPatient(@Param('patientId') patientId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.labsService.findByPatient(patientId, page, limit);
    }

    @Get('orders/admission/:admissionId')
    findByAdmission(@Param('admissionId') admissionId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.labsService.findByAdmission(admissionId, page, limit);
    }

    @Get('orders/:id')
    findOne(@Param('id') id: string) {
        return this.labsService.findOne(id);
    }

    @Put('panels/:panelId/results')
    updateResults(@Param('panelId') panelId: string, @Body() updateDto: UpdateLabPanelResultsDto) {
        return this.labsService.updatePanelResults(panelId, updateDto);
    }

    @Post('orders/:id/finalize')
    finalizeOrder(@Param('id') id: string, @Request() req: any) {
        return this.labsService.finalizeOrder(id, req.user.id);
    }

    @Put('panels/:panelId/collect')
    collectSample(@Param('panelId') panelId: string) {
        return this.labsService.collectSample(panelId);
    }

    @Put('panels/:panelId/receive')
    receiveSample(@Param('panelId') panelId: string) {
        return this.labsService.receiveSample(panelId);
    }

    // NEW: Sample rejection endpoint with reason capture
    @Put('panels/:panelId/reject')
    rejectSample(
        @Param('panelId') panelId: string,
        @Body() dto: RejectSampleDto,
        @Request() req: any,
    ) {
        return this.labsService.rejectSample(panelId, dto.reason, req.user.id);
    }
}
