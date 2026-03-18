import { Controller, Get, Post, Body, Patch, Param, Query, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto, RescheduleAppointmentDto } from './dto/create-appointment.dto';
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
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.appointmentsService.findAll({ date, status, doctorId, search, patientId, page, limit });
    }

    @Get('doctors')
    getDoctors() {
        return this.appointmentsService.getDoctors();
    }

    @Get('departments')
    getDepartments() {
        return this.appointmentsService.getDepartments();
    }

    @Get('types')
    getTypes() {
        return this.appointmentsService.getTypes();
    }

    @Get('stats')
    getStats(@Query('date') date: string) {
        return this.appointmentsService.getStats(date);
    }

    @Get('calendar')
    getCalendar(
        @Query('month') month?: string,
        @Query('doctorId') doctorId?: string,
    ) {
        return this.appointmentsService.getCalendar(month, doctorId);
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

    @Patch(':id/reschedule')
    reschedule(
        @Param('id') id: string,
        @Body() dto: RescheduleAppointmentDto,
    ) {
        return this.appointmentsService.reschedule(id, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    remove(@Param('id') id: string) {
        return this.appointmentsService.remove(id);
    }
}
