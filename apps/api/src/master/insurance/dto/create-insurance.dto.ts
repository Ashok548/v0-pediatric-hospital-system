import { IsString, IsOptional, IsEmail, MinLength, IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class CreateInsuranceDto {
    @IsString()
    @MinLength(2)
    code: string;

    @IsString()
    @MinLength(2)
    name: string;

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
}
