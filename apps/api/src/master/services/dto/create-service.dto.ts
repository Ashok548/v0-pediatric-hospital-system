import { IsString, IsEnum, IsOptional, MinLength, IsNumber, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class CreateServiceDto {
    @IsOptional()
    @IsString()
    @MinLength(2, { message: "Code must be at least 2 characters" })
    code?: string;

    @IsString()
    @MinLength(2, { message: "Name must be at least 2 characters" })
    name: string;

    @IsEnum(["CONSULTATION", "LAB", "PROCEDURE", "ROOM", "MISC"], {
        message: "category must be CONSULTATION, LAB, PROCEDURE, ROOM, or MISC",
    })
    category: "CONSULTATION" | "LAB" | "PROCEDURE" | "ROOM" | "MISC";

    @Type(() => Number)
    @IsNumber({}, { message: "basePrice must be a number" })
    @Min(0, { message: "basePrice must be 0 or greater" })
    basePrice: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(100, { message: "taxPercent must be between 0 and 100" })
    taxPercent?: number = 0;

    @IsOptional()
    @IsEnum(["ACTIVE", "INACTIVE"])
    status?: "ACTIVE" | "INACTIVE" = "ACTIVE";
}
