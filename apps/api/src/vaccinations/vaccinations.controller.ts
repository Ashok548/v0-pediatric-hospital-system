import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { VaccinationsService } from './vaccinations.service';
import { AdministerVaccineDto } from './dto/administer-vaccine.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('vaccinations')
export class VaccinationsController {
    constructor(private readonly vaccinationsService: VaccinationsService) { }

    @Get('dashboard')
    getDashboardSummary() {
        return this.vaccinationsService.getDashboardSummary();
    }

    @Get('patient/:patientId')
    findByPatient(@Param('patientId') patientId: string) {
        return this.vaccinationsService.findByPatient(patientId);
    }

    @Post('generate-schedule/:patientId')
    generateSchedule(@Param('patientId') patientId: string) {
        return this.vaccinationsService.generateSchedule(patientId);
    }

    @Put(':id/administer')
    administerVaccine(
        @Param('id') id: string, // vaccine record ID
        @Body() dto: AdministerVaccineDto,
        @Request() req: any
    ) {
        return this.vaccinationsService.administerVaccine(id, dto, req.user.id);
    }
}
