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
    respRate?: number

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    bpSystolic?: number

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    bpDiastolic?: number

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

    // ── Manual Alert Flags ──
    @IsOptional()
    @Type(() => Boolean)
    isCritical?: boolean

    @IsOptional()
    @IsString()
    alertMessage?: string
}
