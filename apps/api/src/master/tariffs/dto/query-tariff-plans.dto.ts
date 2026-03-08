import { IsOptional, IsString, IsEnum, IsInt, IsPositive, Min } from "class-validator";
import { Type } from "class-transformer";

export class QueryTariffPlansDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE";

    @IsOptional()
    @IsEnum(["GENERAL", "ICU", "HDU", "NICU", "PICU", "PRIVATE", "SEMI_PRIVATE"])
    wardType?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;
}
