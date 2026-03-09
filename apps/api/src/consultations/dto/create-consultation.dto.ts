import { IsNotEmpty, IsUUID, IsOptional, IsString } from 'class-validator';

export class CreateConsultationDto {
    @IsUUID()
    @IsNotEmpty()
    patientId: string;

    @IsUUID()
    @IsOptional()
    appointmentId?: string;

    @IsUUID()
    @IsOptional()
    admissionId?: string;

    @IsString()
    @IsOptional()
    chiefComplaint?: string;

    @IsString()
    @IsOptional()
    historyOfIllness?: string;

    @IsString()
    @IsOptional()
    examinationNotes?: string;

    @IsString()
    @IsOptional()
    diagnosis?: string;

    @IsString()
    @IsOptional()
    plan?: string;
}
