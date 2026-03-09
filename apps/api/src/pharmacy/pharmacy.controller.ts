import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { PharmacyService } from './pharmacy.service';
import { CreatePrescriptionDto, DispensePrescriptionDto, GetPrescriptionsQueryDto, AdjustStockDto } from './dto/pharmacy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('pharmacy')
export class PharmacyController {
    constructor(private readonly pharmacyService: PharmacyService) { }

    @Get('inventory')
    async getInventory() {
        const result = await this.pharmacyService.getInventory();
        return { data: result };
    }

    @Get('inventory/low-stock')
    async getLowStockInventory() {
        const result = await this.pharmacyService.getLowStockInventory();
        return { data: result };
    }

    @Post('inventory/:medicationId/adjust')
    async adjustStock(
        @Param('medicationId') medicationId: string,
        @Body() dto: AdjustStockDto,
        @Req() req: any
    ) {
        // Assume req.user.id is populated by JwtAuthGuard
        const result = await this.pharmacyService.adjustStock(
            medicationId,
            { ...dto, performedBy: req.user?.id || 'SYSTEM' }
        );
        return { success: true, data: result };
    }

    @Get('prescriptions')
    async getPrescriptions(@Query() query: GetPrescriptionsQueryDto) {
        const result = await this.pharmacyService.getPrescriptions(query);
        return { data: result };
    }

    @Get('prescriptions/:id')
    async getPrescription(@Param('id') id: string) {
        const result = await this.pharmacyService.getPrescription(id);
        return { data: result };
    }

    @Post('prescriptions')
    async createPrescription(@Body() dto: CreatePrescriptionDto) {
        const result = await this.pharmacyService.createPrescription(dto);
        return { data: result };
    }

    @Post('prescriptions/:id/dispense')
    async dispensePrescription(
        @Param('id') id: string,
        @Body() dto: DispensePrescriptionDto,
        @Req() req: any
    ) {
        const dispensedBy = req.user.name || req.user.id;
        const result = await this.pharmacyService.dispensePrescription(id, dto, dispensedBy);
        return { data: result };
    }

    @Post('prescriptions/:id/return')
    async returnPrescription(@Param('id') id: string, @Req() req: any) {
        const returnedBy = req.user.name || req.user.id;
        const result = await this.pharmacyService.returnPrescription(id, returnedBy);
        return { data: result };
    }

    @Get('stats')
    async getStats() {
        const result = await this.pharmacyService.getStats();
        return { data: result };
    }

    @Get('admission/:admissionId/clearance')
    async checkClearance(@Param('admissionId') admissionId: string) {
        const result = await this.pharmacyService.checkClearance(admissionId);
        return { data: result };
    }
}
