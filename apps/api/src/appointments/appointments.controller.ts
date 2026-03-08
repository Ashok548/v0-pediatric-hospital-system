import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/create-appointment.dto';
import { ApptStatus } from '@carenest/database';

@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post()
    create(@Body() createAppointmentDto: CreateAppointmentDto) {
        return this.appointmentsService.create(createAppointmentDto);
    }

    @Get()
    findAll(
        @Query('date') date?: string,
        @Query('status') status?: ApptStatus,
        @Query('doctorId') doctorId?: string,
        @Query('search') search?: string,
        @Query('patientId') patientId?: string,
    ) {
        return this.appointmentsService.findAll({ date, status, doctorId, search, patientId });
    }

    @Get('doctors')
    getDoctors() {
        return this.appointmentsService.getDoctors();
    }

    @Get('stats')
    getStats(@Query('date') date: string) {
        return this.appointmentsService.getStats(date);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        // Ensure "stats" doesn't hit this
        return this.appointmentsService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body() updateDto: UpdateAppointmentStatusDto,
    ) {
        return this.appointmentsService.updateStatus(id, updateDto);
    }
}
