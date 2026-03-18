import { IsString, IsNotEmpty, IsDateString, IsNumber, IsOptional, MaxLength, MinLength, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate } from 'class-validator';
import { ApptStatus } from '@carenest/database';

export class CreateAppointmentDto {
    @IsString()
    @IsNotEmpty()
    patientId: string;

    @IsString()
    @IsNotEmpty()
    doctorId: string;

    @IsString()
    @IsNotEmpty()
    department: string;

    @IsDateString()
    @IsNotEmpty()
    appointmentDate: string;

    @IsString()
    @IsNotEmpty()
    timeSlot: string;

    @IsNumber()
    @IsOptional()
    duration?: number;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    chiefComplaint?: string;
}

export class UpdateAppointmentStatusDto {
    @IsString()
    @IsNotEmpty()
    status: ApptStatus;
}

export class RescheduleAppointmentDto {
    @IsDateString()
    @IsNotEmpty()
    appointmentDate: string;

    @IsString()
    @IsNotEmpty()
    timeSlot: string;

    @IsString()
    @IsNotEmpty()
    doctorId: string;
}
