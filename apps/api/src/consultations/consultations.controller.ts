import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('consultations')
export class ConsultationsController {
    constructor(private readonly consultationsService: ConsultationsService) { }

    @Post()
    @Roles('DOCTOR')
    create(@Body() createConsultationDto: CreateConsultationDto, @Request() req: any) {
        return this.consultationsService.create(createConsultationDto, req.user.id);
    }

    @Get('patient/:patientId')
    @Roles('DOCTOR', 'NURSE', 'ADMIN')
    findByPatient(@Param('patientId') patientId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
        return this.consultationsService.findByPatient(patientId, page, limit);
    }

    @Get(':id')
    @Roles('DOCTOR', 'NURSE', 'ADMIN')
    findOne(@Param('id') id: string) {
        return this.consultationsService.findOne(id);
    }

    @Put(':id')
    @Roles('DOCTOR')
    update(@Param('id') id: string, @Body() updateConsultationDto: UpdateConsultationDto, @Request() req: any) {
        return this.consultationsService.update(id, updateConsultationDto, req.user.id);
    }

    @Post(':id/sign')
    @Roles('DOCTOR')
    @HttpCode(HttpStatus.OK)
    sign(@Param('id') id: string, @Request() req: any) {
        return this.consultationsService.signConsultation(id, req.user.id);
    }
}
