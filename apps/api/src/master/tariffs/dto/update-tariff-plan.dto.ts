import { IsString, IsOptional, IsEnum, MinLength, IsDateString } from "class-validator";

export class UpdateTariffPlanDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    code?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsDateString()
    effectiveFrom?: string;

    @IsOptional()
    @IsDateString()
    effectiveTo?: string;

    @IsOptional()
    @IsEnum(["GENERAL", "ICU", "HDU", "NICU", "PICU", "PRIVATE", "SEMI_PRIVATE"])
    wardType?: string;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE";
}
