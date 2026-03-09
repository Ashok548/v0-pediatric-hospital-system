import { IsString, IsInt, Min, IsArray, ValidateNested, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PrescriptionStatus } from '@carenest/database';

export class CreatePrescriptionItemDto {
    @IsString()
    medicationId: string;

    @IsInt()
    @Min(1)
    prescribedQty: number;
}

export class CreatePrescriptionDto {
    @IsString()
    patientId: string;

    @IsOptional()
    @IsString()
    admissionId?: string;

    @IsString()
    doctorId: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsArray()
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
