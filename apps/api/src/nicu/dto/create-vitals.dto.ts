import { IsInt, IsDecimal, IsString, IsOptional, Min, Max } from "class-validator"
import { Type } from "class-transformer"

export class CreateVitalsDto {
    @IsOptional()
    @IsInt()
    @Min(50) @Max(300)
    @Type(() => Number)
    heartRate?: number

    @IsOptional()
    @IsInt()
    @Min(50) @Max(100)
    @Type(() => Number)
    spo2?: number

    @IsOptional()
    @Type(() => Number)
    temperature?: number   // °C stored as Decimal

    @IsOptional()
    @IsInt()
    @Min(0) @Max(100)
    @Type(() => Number)
    respiratoryRate?: number

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    bloodPressureSystolic?: number

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    bloodPressureDiastolic?: number

    @IsOptional()
    @Type(() => Number)
    weight?: number   // kg

    @IsOptional()
    @IsString()
    notes?: string

    // Set server-side via JWT; optional to allow direct POST body override in tests
    @IsOptional()
    @IsString()
    recordedBy?: string
}
