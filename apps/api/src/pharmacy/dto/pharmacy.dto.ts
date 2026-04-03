import { IsString, IsInt, Min, IsArray, ValidateNested, IsOptional, IsEnum, IsUUID, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { PrescriptionStatus, MasterStatus } from '@carenest/database';

export class CreatePrescriptionItemDto {
    @IsString()
    medicationId: string;

    @IsInt()
    @Min(1)
    prescribedQty: number;

    @IsOptional()
    @IsString()
    dose?: string;

    @IsOptional()
    @IsString()
    frequency?: string;

    @IsOptional()
    @IsInt()
    duration?: number;

    @IsOptional()
    @IsString()
    instructions?: string;

    @IsOptional()
    @IsString()
    route?: string;
}

export class CreatePrescriptionDto {
    @IsUUID()
    patientId: string;

    @IsOptional()
    @IsString()
    admissionId?: string;

    @IsOptional()
    @IsString()
    appointmentId?: string;

    @IsOptional()
    @IsString()
    opVisitId?: string;

    @IsOptional()
    @IsUUID()
    doctorId: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsString()
    advice?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    followUpDays?: number;

    @IsArray()
    @ArrayMinSize(1, { message: 'Prescription must have at least one medication item' })
    @ValidateNested({ each: true })
    @Type(() => CreatePrescriptionItemDto)
    items: CreatePrescriptionItemDto[];
}

export class DispenseItemDto {
    @IsString()
    prescriptionItemId: string;

    @IsInt()
    @Min(0)
    dispensedQty: number;
}

export class DispensePrescriptionDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DispenseItemDto)
    items: DispenseItemDto[];
}

export class GetPrescriptionsQueryDto {
    @IsOptional()
    @IsEnum(PrescriptionStatus)
    status?: PrescriptionStatus;

    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsString()
    admissionId?: string;

    @IsOptional()
    @IsString()
    patientId?: string;
}

export class AdjustStockDto {
    @IsInt()
    quantity: number;

    @IsOptional()
    @IsString()
    batchNumber?: string;

    @IsOptional()
    @IsString()
    reason?: string;
}

export class CreateMedicationDto {
    @IsString()
    drugName: string;

    @IsString()
    genericName: string;

    @IsString()
    form: string;

    @IsString()
    strength: string;

    @IsString()
    unit: string;

    @Type(() => Number)
    unitPrice: number;

    @Type(() => Number)
    @IsInt()
    stockAvailable: number;

    @Type(() => Number)
    @IsInt()
    reorderLevel: number;
}


export class BulkCreateMedicationsDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateMedicationDto)
    medications: CreateMedicationDto[];
}

export class UpdateMedicationDto {
    @IsOptional()
    @IsString()
    drugName?: string;

    @IsOptional()
    @IsString()
    genericName?: string;

    @IsOptional()
    @IsString()
    form?: string;

    @IsOptional()
    @IsString()
    strength?: string;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsOptional()
    @Type(() => Number)
    unitPrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    stockAvailable?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    reorderLevel?: number;

    @IsOptional()
    @IsEnum(MasterStatus)
    status?: MasterStatus;
}
