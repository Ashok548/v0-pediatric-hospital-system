import { IsString, IsOptional, IsEmail, MinLength, IsNumber, Min, Max, IsEnum } from "class-validator";
import { Type } from "class-transformer";

export class UpdateInsuranceDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    code?: string;

    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsEmail()
    contactEmail?: string;

    @IsOptional()
    @IsString()
    contactPhone?: string;

    @IsOptional()
    @IsString()
    claimPrefix?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(100)
    discountPercent?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxCoverLimit?: number;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE";
}
