import { IsString, IsEnum, IsOptional, MinLength, IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class UpdateServiceDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    name?: string;

    @IsOptional()
    @IsEnum(["CONSULTATION", "LAB", "PROCEDURE", "ROOM", "MISC"])
    category?: "CONSULTATION" | "LAB" | "PROCEDURE" | "ROOM" | "MISC";

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    basePrice?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(100)
    taxPercent?: number;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE";
}
