import { ApptStatus } from '@carenest/database';
import { CreateAppointmentDto, UpdateAppointmentStatusDto } from './dto/create-appointment.dto';
export declare class AppointmentsService {
    private readonly prisma;
    constructor();
    private calculateAge;
    getDoctors(): Promise<any>;
    private mapStatus;
    private mapInputStatus;
    private formatResponse;
    create(dto: CreateAppointmentDto): Promise<any>;
    findAll(filters: {
        date?: string;
        status?: ApptStatus;
        doctorId?: string;
        search?: string;
        patientId?: string;
    }): Promise<any>;
    getStats(date?: string): Promise<{
        total: any;
        scheduled: number;
        inProgress: number;
        completed: number;
        cancelled: number;
        noShow: number;
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
    updateStatus(id: string, dto: UpdateAppointmentStatusDto): Promise<{
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
    getCalendar(month?: string, doctorId?: string): Promise<{
        year: number;
        month: number;
        days: Record<number, number>;
    }>;
}
