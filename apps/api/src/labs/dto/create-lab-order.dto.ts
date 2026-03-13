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

    @IsString()
    @IsOptional()
    admissionId?: string;

    @IsString()
    @IsOptional()
    appointmentId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateLabPanelDto)
    panels: CreateLabPanelDto[];

    @IsString()
    @IsOptional()
    technicianNotes?: string;
}
