import { Controller, Get, Post, Body, Patch, Param, Query, Delete, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto, RescheduleAppointmentDto } from './dto/create-appointment.dto';
import { ApptStatus } from '@carenest/database';

@Controller('appointments')
export class AppointmentsController {
    constructor(private readonly appointmentsService: AppointmentsService) { }

    @Post()
    @Roles('RECEPTIONIST', 'ADMIN', 'DOCTOR')
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

    @Get('last-visit/:patientId')
    getLastVisit(@Param('patientId') patientId: string) {
        return this.appointmentsService.getLastVisit(patientId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        // Ensure "stats" doesn't hit this
        return this.appointmentsService.findOne(id);
    }

    @Patch(':id/status')
    @Roles('RECEPTIONIST', 'ADMIN', 'DOCTOR', 'NURSE')
    updateStatus(
        @Param('id') id: string,
        @Body() updateDto: UpdateAppointmentStatusDto,
        @Request() req: any,
    ) {
        return this.appointmentsService.updateStatus(id, updateDto, req.user?.id);
    }

    @Patch(':id/reschedule')
    @Roles('RECEPTIONIST', 'ADMIN', 'DOCTOR')
    reschedule(
        @Param('id') id: string,
        @Body() dto: RescheduleAppointmentDto,
    ) {
        return this.appointmentsService.reschedule(id, dto);
    }

    @Delete(':id')
    @Roles('ADMIN', 'RECEPTIONIST')
    @HttpCode(HttpStatus.OK)
    remove(@Param('id') id: string) {
        return this.appointmentsService.remove(id);
    }
}
