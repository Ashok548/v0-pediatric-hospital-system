import { IsString, IsOptional, IsEnum, MinLength, IsDateString, IsArray, ValidateNested, IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";

class TariffRateInput {
    @IsString()
    serviceId: string;

    @IsNumber()
    @Min(0)
    priceOverride: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(100)
    discountPercent?: number;
}

export class CreateTariffPlanDto {
    @IsString()
    @MinLength(2)
    code: string;

    @IsString()
    @MinLength(2)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    effectiveFrom: string;

    @IsOptional()
    @IsDateString()
    effectiveTo?: string;

    @IsOptional()
    @IsEnum(["GENERAL", "ICU", "HDU", "NICU", "PICU", "PRIVATE", "SEMI_PRIVATE"])
    wardType?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TariffRateInput)
    rates?: TariffRateInput[];
}
