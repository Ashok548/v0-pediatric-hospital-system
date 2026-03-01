import { IsInt, IsString, IsOptional, Min } from "class-validator"
import { Type } from "class-transformer"

export class CreateGrowthRecordDto {
    @IsInt()
    @Min(0)
    @Type(() => Number)
    ageMonths!: number

    @IsOptional()
    @Type(() => Number)
    weight?: number  // kg

    @IsOptional()
    @Type(() => Number)
    height?: number  // cm

    @IsOptional()
    @Type(() => Number)
    headCircumference?: number  // cm

    @IsOptional()
    @IsString()
    notes?: string

    @IsOptional()
    @IsString()
    recordedBy?: string
}
