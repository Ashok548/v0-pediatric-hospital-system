import { ApptStatus } from '@carenest/database';
export declare class CreateAppointmentDto {
    patientId: string;
    doctorId: string;
    department: string;
    appointmentDate: string;
    timeSlot: string;
    duration?: number;
    type: string;
    notes?: string;
    chiefComplaint?: string;
}
export declare class UpdateAppointmentStatusDto {
    status: ApptStatus;
}
