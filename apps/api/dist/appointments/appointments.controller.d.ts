import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/create-appointment.dto';
import { ApptStatus } from '@carenest/database';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    create(createAppointmentDto: CreateAppointmentDto): Promise<any>;
    findAll(date?: string, status?: ApptStatus, doctorId?: string, search?: string, patientId?: string): Promise<any>;
    getDoctors(): Promise<any>;
    getStats(date: string): Promise<{
        total: any;
        scheduled: number;
        inProgress: number;
        completed: number;
        cancelled: number;
        noShow: number;
    }>;
    getCalendar(month?: string, doctorId?: string): Promise<{
        year: number;
        month: number;
        days: Record<number, number>;
    }>;
    findOne(id: string): Promise<{
        id: string;
        patientName: string;
        uhid: string;
        age: string;
        gender: string;
        doctor: string;
        doctorId: string;
        department: string;
        appointmentDate: string;
        time: string;
        duration: number;
        status: string;
        type: string;
        token: number;
        notes: string | null;
        chiefComplaint: string | null;
    }>;
    updateStatus(id: string, updateDto: UpdateAppointmentStatusDto): Promise<{
        id: string;
        patientName: string;
        uhid: string;
        age: string;
        gender: string;
        doctor: string;
        doctorId: string;
        department: string;
        appointmentDate: string;
        time: string;
        duration: number;
        status: string;
        type: string;
        token: number;
        notes: string | null;
        chiefComplaint: string | null;
    }>;
}
