import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { LabsService } from './labs.service';
import { CreateLabOrderDto } from './dto/create-lab-order.dto';
import { UpdateLabPanelResultsDto } from './dto/update-lab-results.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('labs')
export class LabsController {
    constructor(private readonly labsService: LabsService) { }

    @Post('orders')
    createOrder(@Body() createLabOrderDto: CreateLabOrderDto, @Request() req: any) {
        return this.labsService.createOrder(createLabOrderDto, req.user.id);
    }

    @Get('orders')
    findAll() {
        return this.labsService.findAll();
    }

    @Get('orders/patient/:patientId')
    findByPatient(@Param('patientId') patientId: string) {
        return this.labsService.findByPatient(patientId);
    }

    @Get('orders/admission/:admissionId')
    findByAdmission(@Param('admissionId') admissionId: string) {
        return this.labsService.findByAdmission(admissionId);
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
}
