import { IsNotEmpty, IsUUID, IsString, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLabPanelDto {
    @IsString()
    @IsNotEmpty()
    panelName: string;

    @IsString()
    @IsNotEmpty()
    category: string;

    @IsString()
    @IsNotEmpty()
    sampleType: string;

    @IsUUID()
    @IsOptional()
    testProfileId?: string;
}

export class CreateLabOrderDto {
    @IsUUID()
    @IsNotEmpty()
    patientId: string;

    @IsUUID()
    @IsOptional()
    admissionId?: string;

    @IsUUID()
    @IsOptional()
    appointmentId?: string;

    @IsUUID()
    @IsOptional()
    opVisitId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateLabPanelDto)
    panels: CreateLabPanelDto[];

    @IsString()
    @IsOptional()
    technicianNotes?: string;
}
