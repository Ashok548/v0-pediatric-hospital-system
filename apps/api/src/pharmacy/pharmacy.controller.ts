import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, Patch, Delete } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { PharmacyService } from './pharmacy.service';
import { CreatePrescriptionDto, DispensePrescriptionDto, GetPrescriptionsQueryDto, AdjustStockDto, CreateMedicationDto, BulkCreateMedicationsDto, UpdateMedicationDto } from './dto/pharmacy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('pharmacy')
export class PharmacyController {
    constructor(private readonly pharmacyService: PharmacyService) { }

    @Get('inventory')
    @Roles('ADMIN', 'PHARMACIST', 'DOCTOR')
    async getInventory() {
        const result = await this.pharmacyService.getInventory();
        return { data: result };
    }

    @Get('inventory/low-stock')
    @Roles('ADMIN', 'PHARMACIST')
    async getLowStockInventory() {
        const result = await this.pharmacyService.getLowStockInventory();
        return { data: result };
    }

    @Post('inventory')
    @Roles('ADMIN')
    async createMedication(@Body() dto: CreateMedicationDto) {
        const result = await this.pharmacyService.createMedication(dto);
        return { success: true, data: result };
    }

    @Post('inventory/bulk')
    @Roles('ADMIN')
    async bulkCreateMedications(@Body() dto: BulkCreateMedicationsDto) {
        const result = await this.pharmacyService.bulkCreateMedications(dto);
        return { success: true, data: result };
    }

    @Patch('inventory/:id')
    @Roles('ADMIN', 'PHARMACIST')
    async updateMedication(@Param('id') id: string, @Body() dto: UpdateMedicationDto) {
        const result = await this.pharmacyService.updateMedication(id, dto);
        return { success: true, data: result };
    }

    @Delete('inventory/:id')
    @Roles('ADMIN')
    async deactivateMedication(@Param('id') id: string) {
        const result = await this.pharmacyService.deactivateMedication(id);
        return { success: true, data: result };
    }

    @Post('inventory/:medicationId/adjust')
    @Roles('ADMIN', 'PHARMACIST')
    async adjustStock(
        @Param('medicationId') medicationId: string,
        @Body() dto: AdjustStockDto,
        @Req() req: any
    ) {
        const result = await this.pharmacyService.adjustStock(
            medicationId,
            { ...dto, performedBy: req.user?.id ?? 'SYSTEM' }
        );
        return { success: true, data: result };
    }

    @Get('prescriptions')
    @Roles('ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE')
    async getPrescriptions(@Query() query: GetPrescriptionsQueryDto) {
        const result = await this.pharmacyService.getPrescriptions(query);
        return { data: result };
    }

    @Get('prescriptions/:id')
    @Roles('ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE')
    async getPrescription(@Param('id') id: string) {
        const result = await this.pharmacyService.getPrescription(id);
        return { data: result };
    }

    @Post('prescriptions')
    @Roles('DOCTOR', 'ADMIN')
    async createPrescription(@Body() dto: CreatePrescriptionDto, @Req() req: any) {
        const result = await this.pharmacyService.createPrescription(dto, req.user?.id);
        return { data: result };
    }

    @Post('prescriptions/:id/dispense')
    @Roles('PHARMACIST', 'ADMIN')
    async dispensePrescription(
        @Param('id') id: string,
        @Body() dto: DispensePrescriptionDto,
        @Req() req: any
    ) {
        const dispensedBy = req.user?.id ?? 'unknown';
        const result = await this.pharmacyService.dispensePrescription(id, dto, dispensedBy);
        return { data: result };
    }

    @Post('prescriptions/:id/return')
    @Roles('PHARMACIST', 'ADMIN')
    async returnPrescription(@Param('id') id: string, @Req() req: any) {
        const returnedBy = req.user?.id ?? 'unknown';
        const result = await this.pharmacyService.returnPrescription(id, returnedBy);
        return { data: result };
    }

    @Get('stats')
    @Roles('ADMIN', 'PHARMACIST')
    async getStats() {
        const result = await this.pharmacyService.getStats();
        return { data: result };
    }

    @Get('admission/:admissionId/clearance')
    @Roles('ADMIN', 'PHARMACIST', 'DOCTOR', 'NURSE')
    async checkClearance(@Param('admissionId') admissionId: string) {
        const result = await this.pharmacyService.checkClearance(admissionId);
        return { data: result };
    }
}
