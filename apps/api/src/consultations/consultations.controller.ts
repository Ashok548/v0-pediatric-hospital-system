import { Controller, Get, Post, Body, Param, Put, UseGuards, Request } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { CreateConsultationDto } from './dto/create-consultation.dto';
import { UpdateConsultationDto } from './dto/update-consultation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('consultations')
export class ConsultationsController {
    constructor(private readonly consultationsService: ConsultationsService) { }

    @Post()
    create(@Body() createConsultationDto: CreateConsultationDto, @Request() req: any) {
        return this.consultationsService.create(createConsultationDto, req.user.id);
    }

    @Get('patient/:patientId')
    findByPatient(@Param('patientId') patientId: string) {
        return this.consultationsService.findByPatient(patientId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.consultationsService.findOne(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateConsultationDto: UpdateConsultationDto, @Request() req: any) {
        return this.consultationsService.update(id, updateConsultationDto, req.user.id);
    }
}
