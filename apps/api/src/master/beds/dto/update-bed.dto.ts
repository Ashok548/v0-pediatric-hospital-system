import { IsString, IsUUID, IsEnum, IsOptional, MinLength } from "class-validator";

export class UpdateBedDto {
    @IsOptional()
    @IsUUID("4", { message: "wardId must be a valid UUID" })
    wardId?: string;

    @IsOptional()
    @IsString()
    @MinLength(1)
    bedNumber?: string;

    @IsOptional()
    @IsEnum(["AVAILABLE", "OCCUPIED", "CLEANING", "RESERVED", "MAINTENANCE"])
    status?: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED" | "MAINTENANCE";

    @IsOptional()
    @IsString()
    notes?: string;
}
