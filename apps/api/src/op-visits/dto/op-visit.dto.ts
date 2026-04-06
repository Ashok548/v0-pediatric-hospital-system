import {
    IsString,
    IsNotEmpty,
    IsUUID,
    IsOptional,
    IsEnum,
    IsIn,
} from "class-validator";
import { OPVisitStatus } from "@carenest/database";

export class CreateOPVisitDto {
    @IsUUID()
    patientId: string;

    @IsOptional()
    @IsUUID()
    appointmentId?: string;

    @IsOptional()
    @IsUUID()
    doctorId?: string;

    @IsNotEmpty()
    @IsString()
    department: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateOPVisitStatusDto {
    @IsEnum(OPVisitStatus)
    status: OPVisitStatus;

    @IsOptional()
    @IsIn(['RED', 'ORANGE', 'YELLOW', 'GREEN'])
    triageLevel?: string;

    @IsOptional()
    @IsString()
    triageNotes?: string;
}

export class QueryOPVisitsDto {
    @IsOptional()
    page?: string | number;

    @IsOptional()
    limit?: string | number;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsUUID()
    patientId?: string;

    @IsOptional()
    @IsEnum(OPVisitStatus)
    status?: OPVisitStatus;
}
